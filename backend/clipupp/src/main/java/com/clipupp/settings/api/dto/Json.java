package com.clipupp.settings.api.dto;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Tiny adapter for the Hibernate-stored JSON text column. Values are stored
 * as raw JSON text and (de)serialised at the API boundary.
 *
 * <p>{@link #parse} returns <strong>plain Java types</strong> (String, Number,
 * Boolean, Map, List) — NOT a Jackson {@code JsonNode}. Returning a
 * {@code TextNode}/{@code ObjectNode} would cause Spring's response Jackson
 * to reflect over its {@code isArray()} / {@code isTextual()} getters and
 * emit them as a sprawling object instead of the actual value.
 */
public final class Json {

    private Json() {}

    private static final ObjectMapper M = new ObjectMapper();

    /** Serialise an arbitrary value to a JSONB-compatible string. */
    public static String stringify(Object value) {
        try {
            return M.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot serialise setting value", e);
        }
    }

    /** Parse a JSONB column into plain Java types (String, Number, Map, List). */
    public static Object parse(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            // readValue → returns String / Integer / Long / Double / Boolean /
            // List / Map (LinkedHashMap) depending on the JSON shape. Jackson
            // round-trips these back to native JSON on the response.
            return M.readValue(value, Object.class);
        } catch (Exception e) {
            return value; // leave it as opaque text rather than failing the read
        }
    }
}
