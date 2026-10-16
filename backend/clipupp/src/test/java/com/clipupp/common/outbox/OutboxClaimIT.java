package com.clipupp.common.outbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.clipupp.common.audit.AuditAware;
import com.clipupp.common.config.AuditingConfig;
import com.clipupp.common.config.FlywayConfig;
import com.clipupp.support.AbstractPostgresIT;
import java.time.OffsetDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Proves {@code claimForDispatch} uses {@code FOR UPDATE SKIP LOCKED}: a row
 * held by one transaction comes back empty for a second, instead of blocking.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({FlywayConfig.class, AuditAware.class, AuditingConfig.class})
class OutboxClaimIT extends AbstractPostgresIT {

    @TestConfiguration
    static class NoCaching {
        @Bean
        CacheManager cacheManager() {
            return new NoOpCacheManager();
        }
    }

    @Autowired OutboxRepository repo;
    @Autowired PlatformTransactionManager txm;

    /** Not wrapped in the slice's test transaction: the row must be committed to be visible to the second thread. */
    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void rowHeldByAnotherTransactionIsSkipped() throws Exception {
        OutboxEntry e = new OutboxEntry("test", "{}", OffsetDateTime.now().minusDays(1));
        Long id = new TransactionTemplate(txm).execute(s -> repo.saveAndFlush(e)).getId();

        CountDownLatch held = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicReference<Boolean> firstClaim = new AtomicReference<>();
        Thread holder = new Thread(() -> new TransactionTemplate(txm).executeWithoutResult(s -> {
            firstClaim.set(repo.claimForDispatch(id).isPresent());
            held.countDown();
            try { release.await(5, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
        }));
        holder.start();
        assertThat(held.await(5, TimeUnit.SECONDS)).isTrue();

        boolean secondClaim = new TransactionTemplate(txm).execute(s -> repo.claimForDispatch(id).isPresent());

        release.countDown();
        holder.join();
        assertThat(firstClaim.get()).isTrue();
        assertThat(secondClaim).isFalse();
        repo.deleteById(id);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void rowScheduledForTheFutureIsNotClaimable() {
        OutboxEntry e = new OutboxEntry("test", "{}", OffsetDateTime.now().plusDays(1));
        Long id = new TransactionTemplate(txm).execute(s -> repo.saveAndFlush(e)).getId();

        boolean claimed = new TransactionTemplate(txm).execute(s -> repo.claimForDispatch(id).isPresent());

        assertThat(claimed).isFalse();
        repo.deleteById(id);
    }
}
