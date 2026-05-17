package com.couponvalley.coupons.api.dto;

import com.couponvalley.coupons.application.CouponService.CreateCouponCommand;
import com.couponvalley.coupons.application.CouponService.UpdateCouponCommand;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.domain.CouponType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class CouponInput {

    private CouponInput() {}

    public record Create(
            @NotNull UUID storeId,
            @Size(max = 180) String slug,
            @NotNull CouponType type,
            @Size(max = 60) String code,
            @NotBlank @Size(max = 200) String title,
            @NotBlank String description,
            String terms,
            @Size(max = 60) String savingsLabel,
            BigDecimal minPurchase,
            @Pattern(regexp = "^[A-Z]{3}$", message = "ISO 4217") String minPurchaseCurrency,
            OffsetDateTime startsAt,
            OffsetDateTime expiresAt,
            Boolean verified,
            Boolean exclusive,
            @PositiveOrZero Integer popularityScore,
            String affiliateUrlOverride,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription,
            List<@Size(max = 120) String> categorySlugs
    ) {
        public CreateCouponCommand toCommand() {
            return new CreateCouponCommand(storeId, slug, type, code, title, description, terms, savingsLabel,
                    minPurchase, minPurchaseCurrency, startsAt, expiresAt,
                    verified, exclusive, popularityScore,
                    affiliateUrlOverride, metaTitle, metaDescription, categorySlugs);
        }
    }

    public record Update(
            @Size(max = 180) String slug,
            CouponType type,
            @Size(max = 60) String code,
            @Size(max = 200) String title,
            String description,
            String terms,
            @Size(max = 60) String savingsLabel,
            BigDecimal minPurchase,
            @Pattern(regexp = "^[A-Z]{3}$") String minPurchaseCurrency,
            OffsetDateTime startsAt,
            OffsetDateTime expiresAt,
            CouponStatus status,
            Boolean verified,
            Boolean exclusive,
            @PositiveOrZero Integer popularityScore,
            String affiliateUrlOverride,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription,
            List<@Size(max = 120) String> categorySlugs
    ) {
        public UpdateCouponCommand toCommand() {
            return new UpdateCouponCommand(slug, type, code, title, description, terms, savingsLabel,
                    minPurchase, minPurchaseCurrency, startsAt, expiresAt, status,
                    verified, exclusive, popularityScore,
                    affiliateUrlOverride, metaTitle, metaDescription, categorySlugs);
        }
    }
}
