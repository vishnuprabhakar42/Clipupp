package com.couponvalley.users.domain;

import com.couponvalley.auth.domain.Role;
import com.couponvalley.auth.domain.UserStatus;
import com.couponvalley.common.audit.AuditableEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "email", nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "name")
    private String name;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "locale", nullable = false, length = 10)
    private String locale = "en";

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "failed_login_count", nullable = false)
    private short failedLoginCount;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @ElementCollection(fetch = FetchType.EAGER, targetClass = Role.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_role", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false, length = 30)
    private Set<Role> roles = EnumSet.noneOf(Role.class);

    protected AppUser() {}

    public AppUser(UUID id, String email) {
        this.id = id;
        this.email = email;
    }

    public static AppUser create(String email, String passwordHash, String name, String locale) {
        AppUser u = new AppUser(UUID.randomUUID(), email);
        u.passwordHash = passwordHash;
        u.name = name;
        if (locale != null && !locale.isBlank()) u.locale = locale;
        u.roles = EnumSet.of(Role.USER);
        return u;
    }

    public void recordSuccessfulLogin() {
        this.lastLoginAt = OffsetDateTime.now();
        this.failedLoginCount = 0;
        this.lockedUntil = null;
    }

    public void recordFailedLogin(int lockoutThreshold, java.time.Duration lockDuration) {
        this.failedLoginCount = (short) (this.failedLoginCount + 1);
        if (this.failedLoginCount >= lockoutThreshold) {
            this.lockedUntil = OffsetDateTime.now().plus(lockDuration);
        }
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(OffsetDateTime.now());
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
    }

    public void changePassword(String newHash) {
        this.passwordHash = newHash;
    }

    public void grant(Role role) {
        this.roles.add(role);
    }

    // getters/setters
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getPasswordHash() { return passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public short getFailedLoginCount() { return failedLoginCount; }
    public OffsetDateTime getLockedUntil() { return lockedUntil; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
    public Set<Role> getRoles() { return roles; }
}
