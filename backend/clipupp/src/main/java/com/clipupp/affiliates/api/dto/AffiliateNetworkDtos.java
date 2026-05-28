package com.clipupp.affiliates.api.dto;

import com.clipupp.affiliates.domain.AffiliateNetwork;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class AffiliateNetworkDtos {

    private AffiliateNetworkDtos() {}

    public record Detail(UUID id, String code, String name, boolean active, boolean hasSecret,
                         String configJson) {
        public static Detail from(AffiliateNetwork n) {
            return new Detail(
                    n.getId(), n.getCode(), n.getName(), n.isActive(),
                    n.getPostbackSecretEnc() != null && n.getPostbackSecretEnc().length > 0,
                    n.getConfigJson());
        }
    }

    public record Create(
            @NotBlank @Pattern(regexp = "^[a-z][a-z0-9_-]{1,38}$",
                    message = "lowercase, 2-39 chars, [a-z0-9_-]")
            String code,
            @NotBlank @Size(max = 120) String name,
            String postbackSecret,
            Boolean active,
            String configJson
    ) {}

    public record Update(
            @Size(max = 120) String name,
            String postbackSecret,
            Boolean active,
            String configJson
    ) {}
}
