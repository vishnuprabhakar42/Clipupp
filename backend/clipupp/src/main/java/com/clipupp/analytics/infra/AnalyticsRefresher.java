package com.clipupp.analytics.infra;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically refreshes the analytics materialized views.
 *
 * `REFRESH MATERIALIZED VIEW CONCURRENTLY` cannot run inside a transaction
 * block — Postgres requires it to be its own implicit statement-level tx.
 * We can't use JPA's `Query.executeUpdate()` for that, because Hibernate
 * insists on an active managed transaction. So we open a JDBC connection
 * with autocommit=true and run the REFRESH directly.
 *
 * Daily-bucketed views refresh CONCURRENTLY (no read-lock window). The
 * 30-day rolling top-N views are small enough to refresh non-concurrently
 * in milliseconds.
 */
@Component
public class AnalyticsRefresher {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsRefresher.class);

    private final DataSource ds;

    public AnalyticsRefresher(DataSource ds) {
        this.ds = ds;
    }

    /** Every 15 minutes, plus on startup after 60 s warm-up. */
    @Scheduled(initialDelayString = "PT60S", fixedDelayString = "PT15M")
    public void refresh() {
        long t0 = System.nanoTime();
        try (Connection con = ds.getConnection()) {
            con.setAutoCommit(true);
            try (Statement st = con.createStatement()) {
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clicks_daily");
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversions_daily");
                st.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_signups_daily");
                st.execute("REFRESH MATERIALIZED VIEW mv_top_stores_30d");
                st.execute("REFRESH MATERIALIZED VIEW mv_top_coupons_30d");
            }
            log.info("analytics refresh complete in {} ms",
                    (System.nanoTime() - t0) / 1_000_000);
        } catch (SQLException e) {
            log.warn("analytics refresh failed (will retry next tick): {}", e.getMessage());
        }
    }
}
