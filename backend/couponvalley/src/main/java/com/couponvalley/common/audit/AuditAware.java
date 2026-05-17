package com.couponvalley.common.audit;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Provides the current actor id for {@code @CreatedBy} / {@code @LastModifiedBy}
 * fields. Reads the JWT principal from the SecurityContext. Returns
 * {@link Optional#empty()} for anonymous / system writes.
 *
 * <p>Sprint 1 will populate the principal with a {@link UUID} userId; for now
 * any non-anonymous principal is honored as-is when it parses as a UUID.
 */
@Component("auditAware")
public class AuditAware implements AuditorAware<UUID> {

    @Override
    public Optional<UUID> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(auth.getName()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
