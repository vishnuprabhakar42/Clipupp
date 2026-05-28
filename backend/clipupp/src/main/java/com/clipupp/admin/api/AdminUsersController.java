package com.clipupp.admin.api;

import com.clipupp.auth.domain.Role;
import com.clipupp.auth.domain.UserStatus;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.users.domain.AppUser;
import com.clipupp.users.infra.AppUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/users", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/users", description = "User list, role grants, account status")
public class AdminUsersController {

    private final AppUserRepository userRepo;
    private final AuditLogService audit;

    public AdminUsersController(AppUserRepository userRepo, AuditLogService audit) {
        this.userRepo = userRepo;
        this.audit = audit;
    }

    public record UserRow(UUID id, String email, boolean emailVerified, String name,
                          UserStatus status, OffsetDateTime lastLoginAt,
                          OffsetDateTime createdAt, List<String> roles) {
        public static UserRow from(AppUser u) {
            return new UserRow(u.getId(), u.getEmail(), u.isEmailVerified(), u.getName(),
                    u.getStatus(), u.getLastLoginAt(), u.getCreatedAt(),
                    u.getRoles().stream().map(Enum::name).toList());
        }
    }

    public record GrantRoleRequest(@NotNull Role role) {}
    public record StatusRequest(@NotNull UserStatus status) {}

    @GetMapping(consumes = MediaType.ALL_VALUE)
    @Operation(summary = "Paginated user list — newest first")
    public Page<UserRow> list(@RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "50") int size) {
        Page<AppUser> result = userRepo.findAll(PageRequest.of(
                page, Math.max(1, Math.min(size, 200))));
        return result.map(UserRow::from);
    }

    @GetMapping(value = "/{id}", consumes = MediaType.ALL_VALUE)
    public UserRow get(@PathVariable UUID id) {
        return UserRow.from(userRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found")));
    }

    @PostMapping(value = "/{id}/roles", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Grant a role to a user")
    @Transactional
    public ResponseEntity<UserRow> grantRole(@PathVariable UUID id,
                                             @RequestBody @Valid GrantRoleRequest req) {
        AppUser u = userRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        u.grant(req.role());
        audit.record("USER_ROLE_GRANT", "user", u.getId(),
                Map.of("role", req.role().name()));
        return ResponseEntity.ok(UserRow.from(u));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}/roles/{role}")
    @Operation(summary = "Revoke a role from a user")
    @Transactional
    public UserRow revokeRole(@PathVariable UUID id, @PathVariable Role role) {
        AppUser u = userRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        u.getRoles().remove(role);
        audit.record("USER_ROLE_REVOKE", "user", u.getId(),
                Map.of("role", role.name()));
        return UserRow.from(u);
    }

    @PatchMapping(value = "/{id}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Force a user's account status (e.g. DISABLED)")
    @Transactional
    public UserRow setStatus(@PathVariable UUID id, @RequestBody @Valid StatusRequest req) {
        AppUser u = userRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        u.setStatus(req.status());
        audit.record("USER_STATUS_CHANGE", "user", u.getId(),
                Map.of("status", req.status().name()));
        return UserRow.from(u);
    }
}
