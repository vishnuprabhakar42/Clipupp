package com.couponvalley.common.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Append-only writer for the {@code audit_log} table. Calls are best-effort:
 * a failure here must not break the surrounding business transaction, so
 * exceptions are swallowed and logged rather than rethrown.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository repo;
    private final ObjectMapper json;

    public AuditLogService(AuditLogRepository repo, ObjectMapper json) {
        this.repo = repo;
        this.json = json;
    }

    public void record(String action, String targetType, UUID targetId, Map<String, Object> metadata) {
        try {
            UUID actorId = currentActorId();
            HttpServletRequest req = currentRequest();
            String ip = req == null ? null : req.getRemoteAddr();
            String ua = req == null ? null : req.getHeader("User-Agent");
            String meta = metadata == null ? "{}" : json.writeValueAsString(metadata);
            repo.save(new AuditLog(actorId, action, targetType, targetId, ip, ua, meta));
        } catch (Exception ex) {
            log.warn("Failed to record audit log for action={} target={}/{}: {}",
                    action, targetType, targetId, ex.toString());
        }
    }

    public void record(UUID actorId, String action, String targetType, UUID targetId,
                       Map<String, Object> metadata) {
        try {
            HttpServletRequest req = currentRequest();
            String ip = req == null ? null : req.getRemoteAddr();
            String ua = req == null ? null : req.getHeader("User-Agent");
            String meta = metadata == null ? "{}" : json.writeValueAsString(metadata);
            repo.save(new AuditLog(actorId, action, targetType, targetId, ip, ua, meta));
        } catch (Exception ex) {
            log.warn("Failed to record audit log for action={} target={}/{}: {}",
                    action, targetType, targetId, ex.toString());
        }
    }

    private static UUID currentActorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        try { return UUID.fromString(auth.getName()); }
        catch (IllegalArgumentException ex) { return null; }
    }

    private static HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }
}
