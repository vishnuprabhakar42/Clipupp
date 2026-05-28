package com.clipupp.coupons.domain;

public enum CouponType {
    /** A redemption code the user pastes at checkout. */
    CODE,
    /** A site-wide deal — no code, just a click-through. */
    DEAL,
    /** Free-shipping promotion. */
    FREE_SHIPPING,
    /** In-store / offline-only promotion. */
    IN_STORE
}
