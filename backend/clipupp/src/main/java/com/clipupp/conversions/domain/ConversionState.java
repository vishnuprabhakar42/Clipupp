package com.clipupp.conversions.domain;

public enum ConversionState {
    /** Network reported the order; awaiting clearance. */
    PENDING,
    /** Order cleared, commission earned. Wallet credit happens here in Phase 2. */
    APPROVED,
    /** Network rejected the conversion (return / cancellation / fraud). */
    REJECTED,
    /** Previously APPROVED, now reversed by the network — debit the wallet. */
    REVERSED
}
