package com.clipupp.common.text;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SlugifierTest {

    @Test
    void basic_lowercases_and_hyphenates() {
        assertThat(Slugifier.slugify("Amazon India")).isEqualTo("amazon-india");
        assertThat(Slugifier.slugify("Best Buy"))   .isEqualTo("best-buy");
    }

    @Test
    void collapses_repeated_separators() {
        assertThat(Slugifier.slugify("Hello   World"))     .isEqualTo("hello-world");
        assertThat(Slugifier.slugify("--foo!!! @ bar--"))  .isEqualTo("foo-bar");
    }

    @Test
    void strips_diacritics() {
        assertThat(Slugifier.slugify("Café au lait")).isEqualTo("cafe-au-lait");
        assertThat(Slugifier.slugify("naïve résumé")).isEqualTo("naive-resume");
    }

    @Test
    void expands_ampersand() {
        assertThat(Slugifier.slugify("Macy's & Co")).isEqualTo("macy-s-and-co");
    }

    @Test
    void caps_at_80_chars_and_trims_trailing_hyphen() {
        String huge = "a".repeat(120);
        String s = Slugifier.slugify(huge);
        assertThat(s.length()).isLessThanOrEqualTo(80);
        assertThat(s).doesNotEndWith("-");
    }

    @Test
    void compose_joins_with_hyphen() {
        assertThat(Slugifier.compose("Amazon India", "50% off Electronics"))
                .isEqualTo("amazon-india-50-off-electronics");
    }

    @Test
    void compose_truncates_safely() {
        String prefix = "amazon-india";
        String long_title = "extra ".repeat(50) + "deal";
        String s = Slugifier.compose(prefix, long_title);
        assertThat(s.length()).isLessThanOrEqualTo(80);
        assertThat(s).doesNotEndWith("-");
        assertThat(s).startsWith("amazon-india");
    }

    @Test
    void empty_input_returns_empty() {
        assertThat(Slugifier.slugify(null)).isEmpty();
        assertThat(Slugifier.slugify("")).isEmpty();
        assertThat(Slugifier.slugify("!!!")).isEmpty();
    }
}
