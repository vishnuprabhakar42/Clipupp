package com.couponvalley.newsletter.domain;

public enum NewsletterStatus {
    /** Email entered, confirmation email dispatched, awaiting click. */
    PENDING,
    /** Confirm token consumed; subscriber receives campaigns. */
    CONFIRMED,
    /** Single-click unsubscribe done; resubscribe by re-entering email. */
    UNSUBSCRIBED
}
