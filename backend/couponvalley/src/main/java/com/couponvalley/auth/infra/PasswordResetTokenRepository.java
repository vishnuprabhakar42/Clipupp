package com.couponvalley.auth.infra;

import com.couponvalley.auth.domain.PasswordResetToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(byte[] tokenHash);

    @Modifying
    @Query("update PasswordResetToken t set t.usedAt = current_timestamp " +
           "where t.userId = :userId and t.usedAt is null")
    int invalidateAllForUser(@Param("userId") UUID userId);
}
