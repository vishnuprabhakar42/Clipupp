package com.couponvalley.clicktrack.api;

import com.couponvalley.clicktrack.domain.Click;
import com.couponvalley.clicktrack.infra.ClickRepository;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorEncoder;
import com.couponvalley.common.pagination.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/account", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "account/clicks", description = "Authenticated user click history")
public class AccountClicksController {

    private final ClickRepository clickRepo;

    public AccountClicksController(ClickRepository clickRepo) {
        this.clickRepo = clickRepo;
    }

    public record ClickItem(UUID id, UUID couponId, UUID storeId, String outboundUrl,
                            OffsetDateTime createdAt) {
        static ClickItem from(Click c) {
            return new ClickItem(c.getId(), c.getCouponId(), c.getStoreId(),
                    c.getOutboundUrl(), c.getCreatedAt());
        }
    }

    @GetMapping("/clicks")
    @Operation(summary = "Paginated outbound-click history for the current user")
    public ResponseEntity<CursorPage<ClickItem>> clicks(
            Authentication auth,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        UUID userId = parseUserId(auth);
        int size = limit == null ? 25 : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<Click> result = clickRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(CursorPage.from(result, ClickItem::from));
    }

    private static UUID parseUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw ApiException.unauthorized("Not authenticated");
        }
        try { return UUID.fromString(auth.getName()); }
        catch (IllegalArgumentException ex) { throw ApiException.unauthorized("Invalid session"); }
    }
}
