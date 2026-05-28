package com.clipupp.newsletter.api.dto;

import com.clipupp.newsletter.application.NewsletterService;
import com.clipupp.newsletter.domain.NewsletterStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class NewsletterDtos {

    private NewsletterDtos() {}

    public record SubscribeRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 10) String locale
    ) {}

    public record SubscribeResponse(NewsletterStatus state, boolean confirmEmailSent) {
        public static SubscribeResponse from(NewsletterService.SubscribeResult r) {
            return new SubscribeResponse(r.state(), r.confirmEmailSent());
        }
    }

    public record StateResponse(NewsletterStatus state, String email) {}
}
