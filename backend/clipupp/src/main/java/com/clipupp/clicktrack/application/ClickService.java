package com.clipupp.clicktrack.application;

import com.clipupp.affiliates.application.LinkTemplateEngine;
import com.clipupp.clicktrack.domain.Click;
import com.clipupp.clicktrack.domain.ClickSource;
import com.clipupp.clicktrack.infra.ClickRepository;
import com.clipupp.common.error.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records outbound clicks. The hot path is synchronous (single insert,
 * sub-5ms) — we promote it to an async Kafka producer when sustained click
 * volume crosses 200 rps (architecture §9.4).
 */
@Service
public class ClickService {

    private final ClickRedirectCache redirectCache;
    private final LinkTemplateEngine templateEngine;
    private final ClickRepository clickRepo;

    public ClickService(ClickRedirectCache redirectCache, LinkTemplateEngine templateEngine,
                        ClickRepository clickRepo) {
        this.redirectCache = redirectCache;
        this.templateEngine = templateEngine;
        this.clickRepo = clickRepo;
    }

    public record ClickResult(UUID clickId, String outboundUrl, String storeName) {}

    @Transactional
    public ClickResult recordClick(UUID couponId, UUID userId, HttpServletRequest request) {
        CouponRedirectInfo info = redirectCache.lookup(couponId);
        if (info == null) {
            throw ApiException.notFound("Coupon is not available for clickout");
        }

        UUID clickId = UUID.randomUUID();
        String outboundUrl = info.deeplinkTemplate() == null
                // No active affiliate link — fall back to the merchant URL directly.
                // Click is still recorded so we can audit + later re-attribute.
                ? info.merchantUrl()
                : templateEngine.render(info.deeplinkTemplate(),
                        new LinkTemplateEngine.RenderContext(
                                info.merchantUrl(),
                                clickId.toString(),
                                info.advertiserId(),
                                info.networkCode()));

        Click click = Click.record(
                clickId,
                info.couponId(),
                info.storeId(),
                info.networkId(),
                userId,
                ClickSource.WEB,
                request == null ? null : request.getRemoteAddr(),
                request == null ? null : request.getHeader("User-Agent"),
                request == null ? null : request.getHeader("Referer"),
                null,
                outboundUrl);
        clickRepo.save(click);

        bumpCouponClickCounter(couponId);
        return new ClickResult(clickId, outboundUrl, info.storeName());
    }

    /** Fire-and-forget popularity-counter increment. */
    @Async
    void bumpCouponClickCounter(UUID couponId) {
        // Phase 1: best-effort, no error path. Phase 2 wires this to the
        // popularity scoring job that updates `coupon.popularity_score`.
    }
}
