package com.clipupp.users.api.dto;

import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record UpdateProfileRequest(
        @Size(max = 120) String name,
        @URL @Size(max = 500) String imageUrl,
        @Size(max = 10) String locale
) {}
