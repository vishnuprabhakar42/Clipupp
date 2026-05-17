package com.couponvalley.users.application;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.users.domain.AppUser;
import com.couponvalley.users.domain.UserPreference;
import com.couponvalley.users.infra.AppUserRepository;
import com.couponvalley.users.infra.UserPreferenceRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final AppUserRepository userRepo;
    private final UserPreferenceRepository prefRepo;

    public UserService(AppUserRepository userRepo, UserPreferenceRepository prefRepo) {
        this.userRepo = userRepo;
        this.prefRepo = prefRepo;
    }

    @Transactional(readOnly = true)
    public AppUser require(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    @Transactional(readOnly = true)
    public UserPreference requirePreference(UUID userId) {
        return prefRepo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Preferences not found"));
    }

    @Transactional
    public AppUser updateProfile(UUID userId, String name, String imageUrl, String locale) {
        AppUser user = require(userId);
        if (name != null) user.setName(name);
        if (imageUrl != null) user.setImageUrl(imageUrl);
        if (locale != null && !locale.isBlank()) user.setLocale(locale);
        return user;
    }

    @Transactional
    public UserPreference updatePreferences(UUID userId, String preferredCurrency,
                                            Boolean emailOptIn, Boolean weeklyDigestOptIn,
                                            Boolean marketingOptIn) {
        UserPreference p = prefRepo.findById(userId).orElseGet(() -> {
            UserPreference fresh = new UserPreference(userId);
            return prefRepo.save(fresh);
        });
        if (preferredCurrency != null) p.setPreferredCurrency(preferredCurrency);
        if (emailOptIn != null) p.setEmailOptIn(emailOptIn);
        if (weeklyDigestOptIn != null) p.setWeeklyDigestOptIn(weeklyDigestOptIn);
        if (marketingOptIn != null) p.setMarketingOptIn(marketingOptIn);
        p.touch();
        return p;
    }
}
