package com.couponvalley.affiliates.api.dto;

import com.couponvalley.affiliates.domain.MerchantNetworkLink;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class MerchantNetworkLinkDtos {

    private MerchantNetworkLinkDtos() {}

    public record Detail(UUID id, UUID storeId, UUID networkId, String advertiserId,
                         String deeplinkTemplate, short priority, boolean active) {
        public static Detail from(MerchantNetworkLink l) {
            return new Detail(l.getId(), l.getStoreId(), l.getNetworkId(),
                    l.getAdvertiserId(), l.getDeeplinkTemplate(), l.getPriority(), l.isActive());
        }
    }

    public record Create(
            @NotNull UUID storeId,
            @NotNull UUID networkId,
            @NotBlank @Size(max = 120) String advertiserId,
            @NotBlank String deeplinkTemplate,
            Short priority,
            Boolean active
    ) {}

    public record Update(
            @Size(max = 120) String advertiserId,
            String deeplinkTemplate,
            Short priority,
            Boolean active
    ) {}
}
