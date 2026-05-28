package com.clipupp.auth.domain;

/**
 * Application roles. Spring Security expects the {@code ROLE_} prefix on
 * GrantedAuthority strings; we apply that at SecurityContext-population time
 * and store these enum values verbatim in the {@code user_role} table.
 */
public enum Role {
    USER,
    ADMIN,
    SUPER_ADMIN,
    MERCHANT;

    public String authority() {
        return "ROLE_" + name();
    }
}
