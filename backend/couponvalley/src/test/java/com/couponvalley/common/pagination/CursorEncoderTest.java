package com.couponvalley.common.pagination;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.couponvalley.common.error.ApiException;
import org.junit.jupiter.api.Test;

class CursorEncoderTest {

    @Test
    void offset_round_trip() {
        String enc = CursorEncoder.encode(new CursorEncoder.OffsetCursor(7));
        var dec = CursorEncoder.decode(enc);
        assertThat(dec).isInstanceOf(CursorEncoder.OffsetCursor.class);
        assertThat(((CursorEncoder.OffsetCursor) dec).page()).isEqualTo(7);
    }

    @Test
    void key_cursor_round_trip() {
        var k = new CursorEncoder.KeyCursor("2026-05-01T12:34:56Z", "abc-123");
        String enc = CursorEncoder.encode(k);
        var dec = CursorEncoder.decode(enc);
        assertThat(dec).isInstanceOf(CursorEncoder.KeyCursor.class);
        assertThat(((CursorEncoder.KeyCursor) dec)).isEqualTo(k);
    }

    @Test
    void key_cursor_handles_colons_in_payload() {
        var k = new CursorEncoder.KeyCursor("with:colon:inside", "id:with:colon");
        var dec = CursorEncoder.decode(CursorEncoder.encode(k));
        assertThat(dec).isEqualTo(k);
    }

    @Test
    void decode_null_or_blank_returns_null() {
        assertThat(CursorEncoder.decode(null)).isNull();
        assertThat(CursorEncoder.decode("")).isNull();
        assertThat(CursorEncoder.decode("   ")).isNull();
    }

    @Test
    void decodePageOr_returns_default_when_blank() {
        assertThat(CursorEncoder.decodePageOr(null, 0)).isEqualTo(0);
        assertThat(CursorEncoder.decodePageOr("",   3)).isEqualTo(3);
    }

    @Test
    void decodePageOr_throws_on_non_offset() {
        String key = CursorEncoder.encode(new CursorEncoder.KeyCursor("k", "v"));
        assertThatThrownBy(() -> CursorEncoder.decodePageOr(key, 0))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void decode_garbage_throws_400() {
        assertThatThrownBy(() -> CursorEncoder.decode("not-base64!!"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void decode_negative_offset_throws() {
        // construct a cursor manually that decodes to "o:-3"
        String enc = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("o:-3".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThatThrownBy(() -> CursorEncoder.decode(enc))
                .isInstanceOf(ApiException.class);
    }
}
