package com.clipupp.stores.api.dto;

import com.clipupp.stores.application.StoreService;
import com.clipupp.stores.domain.Faq;
import com.clipupp.stores.domain.FeaturedArticle;
import com.clipupp.stores.domain.Stats;
import com.clipupp.stores.domain.Store;
import com.clipupp.stores.domain.StoreTopOffer;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StoreDetailResponse(
        UUID id,
        String slug,
        String name,
        String logoUrl,
        String description,
        String shortDescription,
        BigDecimal rating,
        int reviewCount,
        String phone,
        String address,
        String primaryUrl,
        String countryCode,
        int popularityScore,
        String metaTitle,
        String metaDescription,
        List<String> topOffers,
        StatsResponse stats,
        WriterResponse contentWriter,
        List<FaqResponse> faqs,
        List<FeaturedArticleResponse> featuredArticles
) {
    public static StoreDetailResponse from(StoreService.StoreDetail d) {
        Store s = d.store();
        return new StoreDetailResponse(
                s.getId(), s.getSlug(), s.getName(), s.getLogoUrl(),
                s.getDescription(), s.getShortDescription(),
                s.getRating(), s.getReviewCount(), s.getPhone(), s.getAddress(),
                s.getPrimaryUrl(), s.getCountryCode(), s.getPopularityScore(),
                s.getMetaTitle(), s.getMetaDescription(),
                d.topOffers().stream().map(StoreTopOffer::getText).toList(),
                d.stats() == null ? null : StatsResponse.from(d.stats()),
                d.writer() == null ? null : WriterResponse.from(d.writer()),
                d.faqs().stream().map(FaqResponse::from).toList(),
                d.articles().stream().map(FeaturedArticleResponse::from).toList());
    }

    public record StatsResponse(int totalOffers, int couponCodes, int inStoreCoupons, int freeShippingDeals) {
        public static StatsResponse from(Stats s) {
            return new StatsResponse(s.getTotalOffers(), s.getCouponCodes(),
                    s.getInStoreCoupons(), s.getFreeShippingDeals());
        }
    }

    public record WriterResponse(String name, String role, String bio, String imageUrl) {
        public static WriterResponse from(com.clipupp.stores.domain.ContentWriter w) {
            return new WriterResponse(w.getName(), w.getRole(), w.getBio(), w.getImageUrl());
        }
    }

    public record FaqResponse(UUID id, short position, String question, String answer) {
        public static FaqResponse from(Faq f) {
            return new FaqResponse(f.getId(), f.getPosition(), f.getQuestion(), f.getAnswer());
        }
    }

    public record FeaturedArticleResponse(UUID id, short position, String title, String description,
                                          String url, String author) {
        public static FeaturedArticleResponse from(FeaturedArticle a) {
            return new FeaturedArticleResponse(a.getId(), a.getPosition(),
                    a.getTitle(), a.getDescription(), a.getUrl(), a.getAuthor());
        }
    }
}
