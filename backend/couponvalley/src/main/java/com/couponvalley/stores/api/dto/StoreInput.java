package com.couponvalley.stores.api.dto;

import com.couponvalley.stores.application.StoreService.CreateStoreCommand;
import com.couponvalley.stores.application.StoreService.UpdateStoreCommand;
import com.couponvalley.stores.domain.StoreStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class StoreInput {

    private StoreInput() {}

    public record Create(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 120) String slug,
            @NotBlank @Size(max = 500) String logoUrl,
            @NotBlank String description,
            @Size(max = 280) String shortDescription,
            @DecimalMin("0") @DecimalMax("5") BigDecimal rating,
            @PositiveOrZero Integer reviewCount,
            @Size(max = 40) String phone,
            @Size(max = 500) String address,
            @NotBlank @Size(max = 500) String primaryUrl,
            @NotBlank @Pattern(regexp = "^[A-Z]{2}$", message = "ISO 3166 alpha-2") String countryCode,
            @PositiveOrZero Integer popularityScore,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "hex color #RRGGBB") String brandColor,
            @Size(max = 40) String cashbackRate,
            @Size(max = 40) String previousCashbackRate,
            @Size(max = 120) String tagline,
            Boolean featured,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription,
            List<@Size(max = 280) String> topOffers
    ) {
        public CreateStoreCommand toCommand() {
            return new CreateStoreCommand(name, slug, logoUrl, description, shortDescription,
                    rating, reviewCount, phone, address, primaryUrl, countryCode,
                    popularityScore, brandColor, cashbackRate, previousCashbackRate, tagline, featured,
                    metaTitle, metaDescription, topOffers);
        }
    }

    public record Update(
            @Size(max = 200) String name,
            @Size(max = 120) String slug,
            @Size(max = 500) String logoUrl,
            String description,
            @Size(max = 280) String shortDescription,
            @DecimalMin("0") @DecimalMax("5") BigDecimal rating,
            @PositiveOrZero Integer reviewCount,
            @Size(max = 40) String phone,
            @Size(max = 500) String address,
            @Size(max = 500) String primaryUrl,
            @Pattern(regexp = "^[A-Z]{2}$", message = "ISO 3166 alpha-2") String countryCode,
            StoreStatus status,
            @PositiveOrZero Integer popularityScore,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "hex color #RRGGBB") String brandColor,
            @Size(max = 40) String cashbackRate,
            @Size(max = 40) String previousCashbackRate,
            @Size(max = 120) String tagline,
            Boolean featured,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription,
            List<@Size(max = 280) String> topOffers
    ) {
        public UpdateStoreCommand toCommand() {
            return new UpdateStoreCommand(name, slug, logoUrl, description, shortDescription,
                    rating, reviewCount, phone, address, primaryUrl, countryCode, status,
                    popularityScore, brandColor, cashbackRate, previousCashbackRate, tagline, featured,
                    metaTitle, metaDescription, topOffers);
        }
    }
}
