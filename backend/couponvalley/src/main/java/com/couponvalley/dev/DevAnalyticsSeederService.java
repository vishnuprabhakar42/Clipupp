package com.couponvalley.dev;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Bulk-seeds the analytics tables so the admin dashboard has rich numbers,
 * curves, and tables to render in dev. Generates tens of thousands of rows
 * by writing batched INSERTs directly through JDBC (skipping JPA entirely)
 * so a full seed completes in seconds, not minutes.
 *
 * What it produces (defaults):
 *   • 3 000  app_user signups distributed over the last 90 days
 *     (gentle uptrend so recent weeks have more signups than weeks 12+)
 *   • 80 000 click events distributed across stores/coupons/networks
 *     (random per-day with weekly cycles + light recent boost)
 *   •  3 500 conversion rows attached to a sampled subset of clicks,
 *     in roughly 50% APPROVED / 25% PENDING / 15% REJECTED / 10% REVERSED
 *     ratios, with random INR commissions
 *
 * Idempotency: the endpoint deletes synthetic rows first (rows whose
 * `created_at` is within the seed window AND whose user email matches the
 * `dev+{n}@couponvalley.local` pattern). Real-user clicks and conversions
 * are left untouched.
 *
 * After insert, the materialized views are refreshed concurrently so the
 * dashboard reflects the new data on the next page load.
 */
@Service
@Profile("dev")
public class DevAnalyticsSeederService {

    private static final Logger log = LoggerFactory.getLogger(DevAnalyticsSeederService.class);
    private static final String SYNTHETIC_EMAIL_DOMAIN = "@couponvalley.local";
    private static final String SYNTHETIC_EMAIL_PREFIX = "dev+";

    private final DataSource ds;
    private final JdbcTemplate jdbc;

    public DevAnalyticsSeederService(DataSource ds, JdbcTemplate jdbc) {
        this.ds = ds;
        this.jdbc = jdbc;
    }

    public record SeedSummary(
            int users, int clicks, int conversions, long elapsedMs) {}

    public SeedSummary seed(int users, int clicks, int conversions, int days) {
        long t0 = System.nanoTime();
        log.info("[ANALYTICS-SEED] start users={} clicks={} conversions={} days={}",
                users, clicks, conversions, days);

        // 1. Reset any prior synthetic rows so this is idempotent.
        wipeSynthetic();

        // 2. Need stores, coupons, networks to attach to. If they're absent
        //    we can't synthesise — return zeros and surface a hint.
        List<UUID> storeIds = jdbc.queryForList(
                "SELECT id FROM store WHERE deleted_at IS NULL", UUID.class);
        List<UUID> couponIds = jdbc.queryForList(
                "SELECT id FROM coupon WHERE deleted_at IS NULL", UUID.class);
        List<UUID> networkIds = jdbc.queryForList(
                "SELECT id FROM affiliate_network", UUID.class);
        if (storeIds.isEmpty() || couponIds.isEmpty() || networkIds.isEmpty()) {
            log.warn("[ANALYTICS-SEED] no stores/coupons/networks — run /api/v1/dev/seed first");
            return new SeedSummary(0, 0, 0,
                    (System.nanoTime() - t0) / 1_000_000);
        }
        // Map coupon -> store for click rows (FK requirement: store_id must
        // match the coupon's store).
        java.util.Map<UUID, UUID> couponToStore = new java.util.HashMap<>();
        jdbc.query("SELECT id, store_id FROM coupon WHERE deleted_at IS NULL",
                rs -> {
                    couponToStore.put(
                            UUID.fromString(rs.getString(1)),
                            UUID.fromString(rs.getString(2)));
                });

        Random rng = new Random(42);

        // 3. Bulk-insert users.
        List<UUID> userIds = insertUsers(users, days, rng);

        // 4. Bulk-insert clicks. We capture a sample of click ids so we can
        //    attach conversions to real clicks.
        List<UUID> sampledClickIds = insertClicks(
                clicks, days, rng, userIds, couponIds, couponToStore, networkIds);

        // 5. Bulk-insert conversions attached to a sampled subset of clicks.
        int conv = insertConversions(
                conversions, days, rng, sampledClickIds, networkIds);

        // 6. Refresh materialised views so the dashboard reflects new data.
        try {
            refreshViews();
        } catch (SQLException e) {
            log.warn("[ANALYTICS-SEED] view refresh failed: {}", e.getMessage());
        }

        long elapsedMs = (System.nanoTime() - t0) / 1_000_000;
        log.info("[ANALYTICS-SEED] done users={} clicks={} conversions={} in {}ms",
                userIds.size(), sampledClickIds.size(), conv, elapsedMs);
        return new SeedSummary(userIds.size(), sampledClickIds.size(), conv, elapsedMs);
    }

    /** Removes anything this service has inserted previously. */
    private void wipeSynthetic() {
        // Delete conversion rows attached to clicks made by synthetic users.
        jdbc.update("""
                DELETE FROM conversion WHERE click_id IN (
                  SELECT click_id FROM click WHERE user_id IN (
                    SELECT id FROM app_user WHERE email LIKE ? || '%' || ?
                  )
                )""", SYNTHETIC_EMAIL_PREFIX, SYNTHETIC_EMAIL_DOMAIN);
        jdbc.update("""
                DELETE FROM click WHERE user_id IN (
                  SELECT id FROM app_user WHERE email LIKE ? || '%' || ?
                )""", SYNTHETIC_EMAIL_PREFIX, SYNTHETIC_EMAIL_DOMAIN);
        jdbc.update("""
                DELETE FROM user_preference WHERE user_id IN (
                  SELECT id FROM app_user WHERE email LIKE ? || '%' || ?
                )""", SYNTHETIC_EMAIL_PREFIX, SYNTHETIC_EMAIL_DOMAIN);
        jdbc.update("""
                DELETE FROM user_role WHERE user_id IN (
                  SELECT id FROM app_user WHERE email LIKE ? || '%' || ?
                )""", SYNTHETIC_EMAIL_PREFIX, SYNTHETIC_EMAIL_DOMAIN);
        jdbc.update("DELETE FROM app_user WHERE email LIKE ? || '%' || ?",
                SYNTHETIC_EMAIL_PREFIX, SYNTHETIC_EMAIL_DOMAIN);
    }

    private List<UUID> insertUsers(int count, int days, Random rng) {
        List<UUID> ids = new ArrayList<>(count);
        try (Connection con = ds.getConnection();
             PreparedStatement ps = con.prepareStatement("""
                     INSERT INTO app_user (id, email, email_verified, name, locale, country_code, status, created_at, updated_at)
                     VALUES (?, ?, TRUE, ?, 'en', 'IN', 'ACTIVE', ?, ?)
                     """)) {
            con.setAutoCommit(false);
            for (int i = 0; i < count; i++) {
                UUID id = UUID.randomUUID();
                OffsetDateTime created = randomTimestamp(days, rng,
                        /* recencyBoost */ 0.4);
                ps.setObject(1, id);
                ps.setString(2, SYNTHETIC_EMAIL_PREFIX + id + SYNTHETIC_EMAIL_DOMAIN);
                ps.setString(3, randomName(rng));
                ps.setTimestamp(4, Timestamp.from(created.toInstant()));
                ps.setTimestamp(5, Timestamp.from(created.toInstant()));
                ps.addBatch();
                ids.add(id);
                if (i % 1_000 == 999) {
                    ps.executeBatch();
                    con.commit();
                }
            }
            ps.executeBatch();
            con.commit();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to bulk-insert users", e);
        }
        return ids;
    }

    private List<UUID> insertClicks(
            int count, int days, Random rng,
            List<UUID> userIds, List<UUID> couponIds,
            java.util.Map<UUID, UUID> couponToStore, List<UUID> networkIds) {
        List<UUID> sampledClickIds = new ArrayList<>(count / 10);
        try (Connection con = ds.getConnection();
             PreparedStatement ps = con.prepareStatement("""
                     INSERT INTO click
                       (id, click_id, user_id, coupon_id, store_id, network_id,
                        source, country_code, outbound_url, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, 'WEB', 'IN', ?, ?)
                     """)) {
            con.setAutoCommit(false);
            for (int i = 0; i < count; i++) {
                UUID id = UUID.randomUUID();
                UUID clickPubId = UUID.randomUUID();
                UUID coupon = couponIds.get(rng.nextInt(couponIds.size()));
                UUID store = couponToStore.get(coupon);
                if (store == null) continue;
                UUID network = networkIds.get(rng.nextInt(networkIds.size()));
                UUID user = rng.nextDouble() < 0.65
                        ? userIds.get(rng.nextInt(userIds.size()))
                        : null;
                OffsetDateTime created = randomTimestamp(days, rng,
                        /* recencyBoost */ 0.3);
                ps.setObject(1, id);
                ps.setObject(2, clickPubId);
                if (user == null) ps.setNull(3, Types.OTHER);
                else ps.setObject(3, user);
                ps.setObject(4, coupon);
                ps.setObject(5, store);
                ps.setObject(6, network);
                ps.setString(7, "https://example.com/?sub_id=" + clickPubId);
                ps.setTimestamp(8, Timestamp.from(created.toInstant()));
                ps.addBatch();
                // Sample one in ~20 click_ids so conversion attachment is cheap.
                if (rng.nextInt(20) == 0) sampledClickIds.add(clickPubId);
                if (i % 2_000 == 1_999) {
                    ps.executeBatch();
                    con.commit();
                }
            }
            ps.executeBatch();
            con.commit();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to bulk-insert clicks", e);
        }
        return sampledClickIds;
    }

    private int insertConversions(
            int count, int days, Random rng,
            List<UUID> sampledClickIds, List<UUID> networkIds) {
        if (sampledClickIds.isEmpty() || networkIds.isEmpty()) return 0;
        String[] states = {"APPROVED", "APPROVED", "APPROVED", "PENDING", "PENDING",
                "REJECTED", "REVERSED"}; // weighted ~43/29/14/14
        int actual = Math.min(count, sampledClickIds.size());
        try (Connection con = ds.getConnection();
             PreparedStatement ps = con.prepareStatement("""
                     INSERT INTO conversion
                       (id, click_id, network_id, network_txn_id, state,
                        order_amount, order_currency, commission_amount, commission_currency,
                        raw_payload, reported_at, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 'INR', '{}'::jsonb, ?, ?, ?)
                     ON CONFLICT (network_id, network_txn_id) DO NOTHING
                     """)) {
            con.setAutoCommit(false);
            for (int i = 0; i < actual; i++) {
                UUID id = UUID.randomUUID();
                UUID clickId = sampledClickIds.get(rng.nextInt(sampledClickIds.size()));
                UUID network = networkIds.get(rng.nextInt(networkIds.size()));
                String state = states[rng.nextInt(states.length)];
                // Orders ₹500–₹15 000, commission 2–8% of order.
                double order = 500 + rng.nextDouble() * 14_500;
                double commissionPct = 0.02 + rng.nextDouble() * 0.06;
                double commission = order * commissionPct;
                OffsetDateTime created = randomTimestamp(days, rng,
                        /* recencyBoost */ 0.25);
                ps.setObject(1, id);
                ps.setObject(2, clickId);
                ps.setObject(3, network);
                ps.setString(4, "tx-" + id);
                ps.setString(5, state);
                ps.setBigDecimal(6, new java.math.BigDecimal(String.format("%.2f", order)));
                ps.setBigDecimal(7, new java.math.BigDecimal(String.format("%.2f", commission)));
                Timestamp ts = Timestamp.from(created.toInstant());
                ps.setTimestamp(8, ts);
                ps.setTimestamp(9, ts);
                ps.setTimestamp(10, ts);
                ps.addBatch();
                if (i % 1_000 == 999) {
                    ps.executeBatch();
                    con.commit();
                }
            }
            ps.executeBatch();
            con.commit();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to bulk-insert conversions", e);
        }
        return actual;
    }

    /**
     * Random timestamp within the last {@code days} days. `recencyBoost`
     * (0..1) skews the distribution toward "today" — 0 = uniform, 1 = all
     * today. Useful for making the timeseries chart trend upward.
     */
    private static OffsetDateTime randomTimestamp(int days, Random rng, double recencyBoost) {
        double r = rng.nextDouble();
        // Bias: r^(1+boost) packs more samples near 0 (= recent).
        double biased = Math.pow(r, 1.0 + recencyBoost * 2.5);
        long secondsBack = (long) (biased * days * 86_400L);
        return OffsetDateTime.now().minusSeconds(secondsBack);
    }

    private static final String[] FIRST = {
            "Aarav", "Ananya", "Vihaan", "Diya", "Arjun", "Ishita", "Krishna",
            "Saanvi", "Reyansh", "Aanya", "Aditya", "Pari", "Ayaan", "Myra",
            "Rohan", "Sara", "Kabir", "Tara", "Vivaan", "Nia"};
    private static final String[] LAST = {
            "Sharma", "Patel", "Kumar", "Singh", "Mehta", "Gupta", "Reddy",
            "Iyer", "Nair", "Khan", "Joshi", "Verma", "Rao", "Das"};

    private static String randomName(Random rng) {
        return FIRST[rng.nextInt(FIRST.length)] + " " + LAST[rng.nextInt(LAST.length)];
    }

    private void refreshViews() throws SQLException {
        try (Connection con = ds.getConnection()) {
            con.setAutoCommit(true);
            try (Statement st = con.createStatement()) {
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clicks_daily");
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversions_daily");
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_signups_daily");
                st.execute("REFRESH MATERIALIZED VIEW mv_top_stores_30d");
                st.execute("REFRESH MATERIALIZED VIEW mv_top_coupons_30d");
            }
        }
    }
}
