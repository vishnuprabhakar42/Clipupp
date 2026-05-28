package com.clipupp.affiliates.application;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * URL templating for affiliate deeplinks. The template is stored on
 * {@code merchant_network_link.deeplink_template} and may reference any of:
 *
 * <pre>
 *   {merchantUrl}    URL-encoded merchant landing page (or override)
 *   {sub_id}         our public click_id, used by networks for attribution
 *   {click_id}       alias of {sub_id}
 *   {advertiser_id}  the merchant's id at the network
 *   {network_code}   the network's short code (e.g. "impact", "cj")
 * </pre>
 *
 * Unknown placeholders are left intact so a misconfigured template fails
 * loudly at click time instead of silently dropping a query parameter.
 */
@Component
public class LinkTemplateEngine {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{([a-zA-Z_]+)\\}");

    public String render(String template, RenderContext ctx) {
        if (template == null || template.isEmpty()) {
            throw new IllegalArgumentException("template is required");
        }
        Map<String, String> values = Map.of(
                "merchantUrl", urlEncode(ctx.merchantUrl()),
                "sub_id", urlEncode(ctx.clickId()),
                "click_id", urlEncode(ctx.clickId()),
                "advertiser_id", urlEncode(ctx.advertiserId() == null ? "" : ctx.advertiserId()),
                "network_code", urlEncode(ctx.networkCode() == null ? "" : ctx.networkCode())
        );

        Matcher m = PLACEHOLDER.matcher(template);
        StringBuilder out = new StringBuilder(template.length() + 64);
        while (m.find()) {
            String key = m.group(1);
            String replacement = values.get(key);
            if (replacement == null) {
                // Preserve unknown placeholder verbatim — audit-log friendly.
                m.appendReplacement(out, Matcher.quoteReplacement(m.group(0)));
            } else {
                m.appendReplacement(out, Matcher.quoteReplacement(replacement));
            }
        }
        m.appendTail(out);
        return out.toString();
    }

    public record RenderContext(String merchantUrl, String clickId, String advertiserId,
                                String networkCode) {}

    private static String urlEncode(String s) {
        if (s == null) return "";
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
