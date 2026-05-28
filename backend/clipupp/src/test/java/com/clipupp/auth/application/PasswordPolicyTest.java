package com.clipupp.auth.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.web.ErrorResponseException;

class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void valid_strong_password_passes() {
        assertThatCode(() -> policy.validate("CorrectHorseBattery3", "user@example.com"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejects_too_short() {
        assertThatThrownBy(() -> policy.validate("Aa1short", "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_no_digits() {
        assertThatThrownBy(() -> policy.validate("OnlyLettersHerePlz", "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_no_upper() {
        assertThatThrownBy(() -> policy.validate("alllowercase123abc", "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_no_lower() {
        assertThatThrownBy(() -> policy.validate("ALLUPPER123ABCDEFG", "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_common_password_substring() {
        assertThatThrownBy(() -> policy.validate("MyPassword12345", "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_password_containing_email_local() {
        assertThatThrownBy(() -> policy.validate("AnshuVerySecret9", "anshu@example.com"))
                .isInstanceOf(ErrorResponseException.class);
    }

    @Test
    void rejects_null() {
        assertThatThrownBy(() -> policy.validate(null, "u@e.com"))
                .isInstanceOf(ErrorResponseException.class);
    }
}
