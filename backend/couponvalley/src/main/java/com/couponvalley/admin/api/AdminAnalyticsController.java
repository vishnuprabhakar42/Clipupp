package com.couponvalley.admin.api;

import com.couponvalley.analytics.api.dto.AnalyticsDtos.FunnelResponse;
import com.couponvalley.analytics.api.dto.AnalyticsDtos.NetworkBreakdownRow;
import com.couponvalley.analytics.api.dto.AnalyticsDtos.SummaryResponse;
import com.couponvalley.analytics.api.dto.AnalyticsDtos.TimeseriesResponse;
import com.couponvalley.analytics.api.dto.AnalyticsDtos.TopCouponRow;
import com.couponvalley.analytics.api.dto.AnalyticsDtos.TopStoreRow;
import com.couponvalley.analytics.application.AnalyticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/analytics", description = "Platform analytics dashboard")
public class AdminAnalyticsController {

    private final AnalyticsService service;

    public AdminAnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public SummaryResponse summary(@RequestParam(defaultValue = "30") int days) {
        return service.summary(days);
    }

    @GetMapping("/timeseries")
    public TimeseriesResponse timeseries(
            @RequestParam(defaultValue = "clicks") String metric,
            @RequestParam(defaultValue = "30") int days) {
        return service.timeseries(metric, days);
    }

    @GetMapping("/top-stores")
    public List<TopStoreRow> topStores(@RequestParam(defaultValue = "10") int limit) {
        return service.topStores(limit);
    }

    @GetMapping("/top-coupons")
    public List<TopCouponRow> topCoupons(@RequestParam(defaultValue = "10") int limit) {
        return service.topCoupons(limit);
    }

    @GetMapping("/funnel")
    public FunnelResponse funnel(@RequestParam(defaultValue = "30") int days) {
        return service.funnel(days);
    }

    @GetMapping("/by-network")
    public List<NetworkBreakdownRow> byNetwork(@RequestParam(defaultValue = "30") int days) {
        return service.byNetwork(days);
    }
}
