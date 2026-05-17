package com.couponvalley.common.text;

import java.text.Normalizer;

/**
 * URL-safe slug generation. Trades full Unicode for ASCII to keep slugs
 * SEO-friendly, copy-pasteable, and stable across systems. Diacritics are
 * stripped via NFD normalization. Non-ASCII characters that don't decompose
 * (e.g. Devanagari, Han) are dropped — non-Latin titles should provide an
 * explicit transliterated slug via the admin form.
 *
 * <p>Output rules:
 * <ul>
 *   <li>lowercase</li>
 *   <li>letters/digits + single hyphens</li>
 *   <li>no leading/trailing hyphens, no double-hyphens</li>
 *   <li>capped at 80 chars (per architecture §11.2)</li>
 * </ul>
 */
public final class Slugifier {

    private Slugifier() {}

    public static final int MAX_LENGTH = 80;

    public static String slugify(String input) {
        if (input == null) return "";
        // Strip diacritics
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        StringBuilder out = new StringBuilder(normalized.length());
        boolean prevHyphen = false;
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            if (c == '&') {
                appendHyphen(out, prevHyphen);
                out.append("and");
                prevHyphen = false;
                continue;
            }
            if (c >= 'A' && c <= 'Z') {
                out.append((char) (c + 32));
                prevHyphen = false;
            } else if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
                out.append(c);
                prevHyphen = false;
            } else {
                if (!prevHyphen && out.length() > 0) {
                    out.append('-');
                    prevHyphen = true;
                }
            }
            if (out.length() >= MAX_LENGTH) break;
        }
        // Trim trailing hyphen / cap length
        while (out.length() > 0 && out.charAt(out.length() - 1) == '-') {
            out.deleteCharAt(out.length() - 1);
        }
        return out.toString();
    }

    /** Compose a slug like {@code "amazon-india-50-off-electronics"} from a store and coupon title. */
    public static String compose(String prefix, String title) {
        String left = slugify(prefix);
        String right = slugify(title);
        if (left.isEmpty()) return right;
        if (right.isEmpty()) return left;
        String combined = left + "-" + right;
        if (combined.length() > MAX_LENGTH) {
            combined = combined.substring(0, MAX_LENGTH);
            while (combined.length() > 0 && combined.charAt(combined.length() - 1) == '-') {
                combined = combined.substring(0, combined.length() - 1);
            }
        }
        return combined;
    }

    private static void appendHyphen(StringBuilder out, boolean prevHyphen) {
        if (!prevHyphen && out.length() > 0) out.append('-');
    }
}
