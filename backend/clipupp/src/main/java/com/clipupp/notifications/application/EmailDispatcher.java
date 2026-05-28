package com.clipupp.notifications.application;

import com.clipupp.common.outbox.OutboxDispatcher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Bridges the outbox poller to {@link EmailAdapter}. Listens on the
 * {@code email.send} topic; payload shape is documented inline.
 */
@Component
public class EmailDispatcher implements OutboxDispatcher {

    public static final String TOPIC = "email.send";

    private final EmailAdapter email;
    private final ObjectMapper json;

    public EmailDispatcher(EmailAdapter email, ObjectMapper json) {
        this.email = email;
        this.json = json;
    }

    @Override
    public String topic() { return TOPIC; }

    @Override
    public void dispatch(String payload) throws Exception {
        // Shape: { "to":"...", "locale":"en|hi", "templateId":"verify-email", "model":{...} }
        JsonNode root = json.readTree(payload);
        String to = root.path("to").asText();
        String locale = root.path("locale").asText("en");
        String templateId = root.path("templateId").asText();
        JsonNode modelNode = root.path("model");

        Map<String, Object> model = new HashMap<>();
        if (modelNode != null && modelNode.isObject()) {
            modelNode.fields().forEachRemaining(e ->
                    model.put(e.getKey(), e.getValue().isValueNode() ? e.getValue().asText() : e.getValue().toString()));
        }
        email.send(to, locale, templateId, model);
    }
}
