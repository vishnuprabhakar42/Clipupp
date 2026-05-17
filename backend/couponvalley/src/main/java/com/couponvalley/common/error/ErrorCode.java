package com.couponvalley.common.error;

/**
 * Stable error codes returned to clients in the {@code code} field of the
 * RFC 7807 problem+json envelope. Frontend branches on these constants,
 * not on HTTP status codes.
 */
public final class ErrorCode {
    private ErrorCode() {}

    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String CONFLICT = "CONFLICT";
    public static final String RATE_LIMITED = "RATE_LIMITED";
    public static final String IDEMPOTENCY_KEY_MISMATCH = "IDEMPOTENCY_KEY_MISMATCH";
    public static final String INTERNAL = "INTERNAL_ERROR";
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";
    public static final String UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE";
    public static final String MALFORMED_REQUEST = "MALFORMED_REQUEST";
}
