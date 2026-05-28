package com.clipupp.analytics.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class AnalyticsDtos {

    private AnalyticsDtos() {}

    public record SummaryResponse(
            int days,
            long users,                        // total users
            long signupsInRange,
            long clicksInRange,
            long conversionsInRange,
            long approvedConversionsInRange,
            BigDecimal commissionInRange,
            String commissionCurrency,
            // 24h
            long signupsToday,
            long clicksToday,
            long conversionsToday,
            // top performers
            String topStoreName,
            Long topStoreClicks,
            String topCouponTitle,
            Long topCouponClicks
    ) {}

    public record TimeseriesPoint(LocalDate day, long value) {}

    public record TimeseriesResponse(String metric, int days, List<TimeseriesPoint> points) {}

    public record TopStoreRow(
            String storeId,
            String storeSlug,
            String storeName,
            String logoUrl,
            long clicks,
            long conversions,
            BigDecimal commission
    ) {}

    public record TopCouponRow(
            String couponId,
            String couponSlug,
            String couponTitle,
            String storeSlug,
            String storeName,
            long clicks
    ) {}

    public record FunnelResponse(
            int days,
            long clicks,
            long conversionsAttempted,
            long conversionsApproved,
            BigDecimal approvedCommission,
            String commissionCurrency
    ) {}

    public record NetworkBreakdownRow(
            String networkId,
            String networkCode,
            String networkName,
            long clicks,
            long conversions,
            long approvedConversions,
            BigDecimal commission
    ) {}
}
