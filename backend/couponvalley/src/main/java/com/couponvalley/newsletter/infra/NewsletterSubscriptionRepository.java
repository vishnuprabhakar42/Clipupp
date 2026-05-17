package com.couponvalley.newsletter.infra;

import com.couponvalley.newsletter.domain.NewsletterStatus;
import com.couponvalley.newsletter.domain.NewsletterSubscription;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsletterSubscriptionRepository
        extends JpaRepository<NewsletterSubscription, UUID> {

    Optional<NewsletterSubscription> findByEmail(String email);

    Optional<NewsletterSubscription> findByConfirmTokenHash(byte[] hash);

    Optional<NewsletterSubscription> findByUnsubscribeTokenHash(byte[] hash);

    Page<NewsletterSubscription> findByStatusOrderByCreatedAtDesc(NewsletterStatus status, Pageable pageable);
}
