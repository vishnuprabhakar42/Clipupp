package com.couponvalley.auth.application;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.error.ErrorCode;
import com.couponvalley.common.error.FieldErrorDto;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.ErrorResponseException;

/**
 * Phase 1 password policy. The Spring docs and OWASP both back the same set
 * of practical rules: long passwords, mixed character classes, blocklist of
 * common phrases. Phase 2 swaps in zxcvbn4j for entropy-scoring.
 *
 * <p>Rules:
 * <ul>
 *   <li>≥ 12 characters</li>
 *   <li>≥ 1 lowercase, ≥ 1 uppercase, ≥ 1 digit</li>
 *   <li>not in a small denylist of obvious passwords</li>
 *   <li>not equal to the email local-part</li>
 * </ul>
 */
@Component
public class PasswordPolicy {

    private static final int MIN_LENGTH = 12;

    private static final List<String> DENYLIST = List.of(
            "password", "passw0rd", "p@ssword", "letmein",
            "qwertyuiop", "iloveyou", "couponvalley", "couponvalley123");

    public void validate(String password, String email) {
        List<FieldErrorDto> issues = new ArrayList<>();
        if (password == null || password.length() < MIN_LENGTH) {
            issues.add(new FieldErrorDto("password", "PASSWORD_TOO_SHORT",
                    "Password must be at least " + MIN_LENGTH + " characters"));
        }
        if (password == null) {
            throw fail(issues);
        }
        boolean hasLower = false, hasUpper = false, hasDigit = false;
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasLower || !hasUpper || !hasDigit) {
            issues.add(new FieldErrorDto("password", "PASSWORD_TOO_WEAK",
                    "Password must contain upper, lower, and a digit"));
        }
        String lower = password.toLowerCase();
        for (String bad : DENYLIST) {
            if (lower.contains(bad)) {
                issues.add(new FieldErrorDto("password", "PASSWORD_TOO_COMMON",
                        "Password is too common"));
                break;
            }
        }
        if (email != null) {
            int at = email.indexOf('@');
            String local = (at > 0 ? email.substring(0, at) : email).toLowerCase();
            if (local.length() >= 4 && lower.contains(local)) {
                issues.add(new FieldErrorDto("password", "PASSWORD_CONTAINS_EMAIL",
                        "Password must not contain your email"));
            }
        }
        if (!issues.isEmpty()) throw fail(issues);
    }

    private static ErrorResponseException fail(List<FieldErrorDto> issues) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY,
                "One or more fields are invalid");
        body.setTitle("Validation failed");
        body.setProperty("code", ErrorCode.VALIDATION_FAILED);
        body.setProperty("errors", issues);
        // Wrap so Spring's ErrorResponse path serializes uniformly.
        ErrorResponseException ex = new ErrorResponseException(HttpStatus.UNPROCESSABLE_ENTITY, body, null);
        // Surface as ApiException for the GlobalExceptionHandler if it would otherwise miss it.
        // (ErrorResponseException is handled natively by Spring 6 / Boot 4.)
        return ex;
    }

    /** Convenience: throw a FORBIDDEN ApiException when reuse rules etc fail. */
    public static ApiException reused() {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED,
                "New password must differ from your previous password");
    }
}
