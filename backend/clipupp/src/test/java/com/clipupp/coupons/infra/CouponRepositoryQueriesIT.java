package com.clipupp.coupons.infra;

import static org.assertj.core.api.Assertions.assertThat;

import com.clipupp.common.audit.AuditAware;
import com.clipupp.common.config.AuditingConfig;
import com.clipupp.common.config.FlywayConfig;
import com.clipupp.coupons.domain.Coupon;
import com.clipupp.coupons.domain.CouponType;
import com.clipupp.stores.domain.Store;
import com.clipupp.stores.domain.StoreStatus;
import com.clipupp.stores.infra.StoreRepository;
import com.clipupp.support.AbstractPostgresIT;
import jakarta.persistence.EntityManager;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

/**
 * Runs the homepage v2 JPQL against a real Postgres migrated from V001 by
 * Flyway, so both the queries (filters, nulls-last ordering, group-by shape)
 * and the migration history on a fresh database are covered.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({FlywayConfig.class, AuditAware.class, AuditingConfig.class})
class CouponRepositoryQueriesIT extends AbstractPostgresIT {

    /** The app class enables caching; the JPA slice has no CacheManager of its own. */
    @TestConfiguration
    static class NoCaching {
        @Bean
        CacheManager cacheManager() {
            return new NoOpCacheManager();
        }
    }

    @Autowired CouponRepository couponRepo;
    @Autowired StoreRepository storeRepo;
    @Autowired EntityManager em;
    @Autowired Flyway flyway;

    private final OffsetDateTime now = OffsetDateTime.now();
    private Store myntra;
    private Store ajio;
    private Store hidden;
    private Coupon popularVerified;
    private Coupon recentVerifiedTie;
    private Coupon olderVerifiedTie;

    @BeforeEach
    void seed() {
        // Clean slate: the dev seed (R__) may have inserted rows; scope assertions to our own data.
        em.createNativeQuery("delete from coupon_category").executeUpdate();
        em.createNativeQuery("delete from coupon").executeUpdate();

        myntra = persist(Store.create("it-myntra", "Myntra", "https://logo.example/myntra.png", "desc", "https://myntra.com", "IN"));
        ajio = persist(Store.create("it-ajio", "Ajio", "https://logo.example/ajio.png", "desc", "https://ajio.com", "IN"));
        hidden = Store.create("it-hidden", "Hidden", "https://logo.example/hidden.png", "desc", "https://hidden.example", "IN");
        hidden.setStatus(StoreStatus.HIDDEN);
        persist(hidden);

        popularVerified = coupon("pop", myntra, 90, true, now.minusDays(20));
        recentVerifiedTie = coupon("tie-recent", myntra, 50, true, now.minusDays(1));
        olderVerifiedTie = coupon("tie-older", ajio, 50, true, now.minusDays(3));
        coupon("unverified", ajio, 99, false, null);

        Coupon expired = coupon("expired", myntra, 100, true, now.minusDays(2));
        expired.setExpiresAt(now.minusHours(1));

        Coupon deleted = coupon("deleted", ajio, 100, true, now.minusDays(2));
        deleted.softDelete();

        em.flush();
        em.clear();
    }

    private <T> T persist(T entity) {
        em.persist(entity);
        return entity;
    }

    private Coupon coupon(String slug, Store store, int popularity, boolean verified, OffsetDateTime verifiedAt) {
        Coupon c = Coupon.create("it-" + slug, store.getId(), CouponType.CODE, "Title " + slug, "d");
        c.setPopularityScore(popularity);
        if (verified) c.applyVerified(true, verifiedAt);
        em.persist(c);
        return c;
    }

    @Test
    void flywayAppliedEveryMigrationOnFreshDatabase() {
        assertThat(flyway.info().pending()).isEmpty();
        // V037 (homepage v2 copy) is the newest migration this test was written against.
        assertThat(flyway.info().current().getVersion().isAtLeast("37")).isTrue();
        assertThat(flyway.info().applied()).allSatisfy(m -> assertThat(m.getState().isFailed()).isFalse());
    }

    @Test
    void findTrendingVerifiedFiltersAndOrders() {
        List<Coupon> out = couponRepo.findTrendingVerified(now, PageRequest.of(0, 10));

        assertThat(out).extracting(Coupon::getId).containsExactly(
                popularVerified.getId(), recentVerifiedTie.getId(), olderVerifiedTie.getId());
    }

    @Test
    void findTrendingVerifiedHonoursPageSize() {
        assertThat(couponRepo.findTrendingVerified(now, PageRequest.of(0, 2))).hasSize(2);
    }

    @Test
    void countActiveByStoreIdsGroupsPerStore() {
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : couponRepo.countActiveByStoreIds(List.of(myntra.getId(), ajio.getId(), hidden.getId()), now)) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }

        // myntra: pop + tie-recent (expired excluded); ajio: tie-older + unverified (deleted excluded)
        assertThat(counts).containsEntry(myntra.getId(), 2L).containsEntry(ajio.getId(), 2L);
        assertThat(counts).doesNotContainKey(hidden.getId());
    }

    @Test
    void countVerifiedSinceOnlyCountsRecentActiveVerified() {
        assertThat(couponRepo.countVerifiedSince(now.minusDays(7), now)).isEqualTo(2L);
        assertThat(couponRepo.countVerifiedSince(now.minusDays(30), now)).isEqualTo(3L);
    }

    @Test
    void countActiveExcludesExpiredAndDeleted() {
        assertThat(couponRepo.countActive(now)).isEqualTo(4L);
    }

    @Test
    void storeCountActiveExcludesHiddenStores() {
        long before = storeRepo.countActive(StoreStatus.ACTIVE);
        Store extra = Store.create("it-extra", "Extra", "https://logo.example/extra.png", "desc", "https://extra.example", "IN");
        em.persist(extra);
        em.flush();

        assertThat(storeRepo.countActive(StoreStatus.ACTIVE)).isEqualTo(before + 1);
        assertThat(storeRepo.countActive(StoreStatus.HIDDEN)).isGreaterThanOrEqualTo(1L);
    }
}
