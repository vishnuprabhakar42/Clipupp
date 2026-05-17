package com.couponvalley.admin.api;

import com.couponvalley.clicktrack.domain.Click;
import com.couponvalley.clicktrack.infra.ClickRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/clicks", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/clicks", description = "Read-only click stream")
public class AdminClicksController {

    private final ClickRepository repo;

    public AdminClicksController(ClickRepository repo) {
        this.repo = repo;
    }

    public record ClickRow(UUID id, UUID clickId, UUID userId, UUID couponId, UUID storeId,
                           UUID networkId, String source, String ipInet, String userAgent,
                           String outboundUrl, OffsetDateTime createdAt) {
        public static ClickRow from(Click c) {
            return new ClickRow(c.getId(), c.getClickId(), c.getUserId(), c.getCouponId(),
                    c.getStoreId(), c.getNetworkId(),
                    c.getSource() == null ? null : c.getSource().name(),
                    c.getIpInet(), c.getUserAgent(), c.getOutboundUrl(), c.getCreatedAt());
        }
    }

    @GetMapping(consumes = MediaType.ALL_VALUE)
    @Operation(summary = "Paginated click stream — newest first")
    public Page<ClickRow> list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "50") int size) {
        Page<Click> result = repo.findAll(PageRequest.of(
                page, Math.max(1, Math.min(size, 200)),
                Sort.by(Sort.Direction.DESC, "createdAt")));
        return result.map(ClickRow::from);
    }
}
