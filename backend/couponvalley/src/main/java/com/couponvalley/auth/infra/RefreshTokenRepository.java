package com.couponvalley.auth.infra;

import com.couponvalley.auth.domain.RefreshToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(byte[] tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revokedAt = current_timestamp " +
           "where r.userId = :userId and r.revokedAt is null")
    int revokeAllForUser(@Param("userId") UUID userId);
}
