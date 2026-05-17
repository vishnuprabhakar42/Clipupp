package com.couponvalley.affiliates.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LinkTemplateEngineTest {

    private final LinkTemplateEngine engine = new LinkTemplateEngine();

    @Test
    void substitutes_all_known_placeholders() {
        String template = "https://network.com/click?u={merchantUrl}&sub={sub_id}&adv={advertiser_id}&n={network_code}";
        String out = engine.render(template, new LinkTemplateEngine.RenderContext(
                "https://merchant.com/landing?ref=cv",
                "01HABC-uuid",
                "ADV-42",
                "impact"));
        assertThat(out).contains("u=https%3A%2F%2Fmerchant.com%2Flanding%3Fref%3Dcv");
        assertThat(out).contains("sub=01HABC-uuid");
        assertThat(out).contains("adv=ADV-42");
        assertThat(out).contains("n=impact");
    }

    @Test
    void click_id_alias_resolves_to_same_value_as_sub_id() {
        String template = "https://x/?a={sub_id}&b={click_id}";
        String out = engine.render(template, new LinkTemplateEngine.RenderContext(
                "https://m.com", "ABC", "id", "code"));
        assertThat(out).isEqualTo("https://x/?a=ABC&b=ABC");
    }

    @Test
    void unknown_placeholder_left_intact() {
        String template = "https://x/?u={merchantUrl}&x={unsupported}";
        String out = engine.render(template, new LinkTemplateEngine.RenderContext(
                "https://m.com", "C", null, null));
        assertThat(out).contains("{unsupported}");
    }

    @Test
    void special_chars_in_merchant_url_are_url_encoded() {
        String template = "https://x/?u={merchantUrl}";
        String out = engine.render(template, new LinkTemplateEngine.RenderContext(
                "https://m.com/?q=hello world&x=a+b", "C", null, null));
        assertThat(out).doesNotContain(" ");
        assertThat(out).contains("hello+world");
    }

    @Test
    void empty_template_throws() {
        assertThatThrownBy(() -> engine.render("", new LinkTemplateEngine.RenderContext(
                "https://m.com", "C", null, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> engine.render(null, new LinkTemplateEngine.RenderContext(
                "https://m.com", "C", null, null)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
