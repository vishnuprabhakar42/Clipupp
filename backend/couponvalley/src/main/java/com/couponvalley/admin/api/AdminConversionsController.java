package com.couponvalley.admin.api;

import com.couponvalley.conversions.domain.Conversion;
import com.couponvalley.conversions.domain.ConversionState;
import com.couponvalley.conversions.infra.ConversionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
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
@RequestMapping(path = "/api/v1/admin/conversions", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/conversions", description = "Read-only conversion stream")
public class AdminConversionsController {

    private final ConversionRepository repo;

    public AdminConversionsController(ConversionRepository repo) {
        this.repo = repo;
    }

    public record ConversionRow(UUID id, UUID clickId, UUID networkId, String networkTxnId,
                                ConversionState state, BigDecimal orderAmount, String orderCurrency,
                                BigDecimal commissionAmount, String commissionCurrency,
                                OffsetDateTime reportedAt, OffsetDateTime createdAt) {
        public static ConversionRow from(Conversion c) {
            return new ConversionRow(c.getId(), c.getClickId(), c.getNetworkId(),
                    c.getNetworkTxnId(), c.getState(),
                    c.getOrderAmount(), c.getOrderCurrency(),
                    c.getCommissionAmount(), c.getCommissionCurrency(),
                    c.getReportedAt(), c.getCreatedAt());
        }
    }

    @GetMapping(consumes = MediaType.ALL_VALUE)
    @Operation(summary = "Paginated conversion stream — newest first")
    public Page<ConversionRow> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "50") int size) {
        Page<Conversion> result = repo.findAll(PageRequest.of(
                page, Math.max(1, Math.min(size, 200)),
                Sort.by(Sort.Direction.DESC, "createdAt")));
        return result.map(ConversionRow::from);
    }
}
