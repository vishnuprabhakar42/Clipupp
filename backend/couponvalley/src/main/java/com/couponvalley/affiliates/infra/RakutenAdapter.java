package com.couponvalley.affiliates.infra;

import com.couponvalley.affiliates.application.HmacVerifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class RakutenAdapter extends StubAdapter {
    public static final String CODE = "rakuten";

    public RakutenAdapter(HmacVerifier hmac, ObjectMapper json) {
        super(hmac, json);
    }

    @Override public String code() { return CODE; }
}
