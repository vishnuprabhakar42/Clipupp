package com.clipupp.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI clipuppOpenApi() {
        SecurityScheme bearer = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Short-lived access token (15min). Frontend obtains it from /api/v1/auth/login " +
                        "and refreshes via /api/v1/auth/refresh.");

        SecurityScheme refreshCookie = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE)
                .name("clipupp_rt")
                .description("Opaque refresh token. HttpOnly, Secure, SameSite=Strict. " +
                        "Set by /api/v1/auth/login and rotated by /api/v1/auth/refresh.");

        return new OpenAPI()
                .info(new Info()
                        .title("Clipupp API")
                        .version("v1")
                        .description("Backend API for Clipupp — coupons, cashback, search, admin, affiliates.")
                        .contact(new Contact().name("Clipupp Engineering").email("eng@clipupp.com"))
                        .license(new License().name("Proprietary")))
                .components(new Components()
                        .addSecuritySchemes("bearer", bearer)
                        .addSecuritySchemes("refreshCookie", refreshCookie))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}
