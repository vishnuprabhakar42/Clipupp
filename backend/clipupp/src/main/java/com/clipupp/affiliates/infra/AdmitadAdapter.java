package com.clipupp.affiliates.infra;

import com.clipupp.affiliates.application.HmacVerifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class AdmitadAdapter extends StubAdapter {
    public static final String CODE = "admitad";

    public AdmitadAdapter(HmacVerifier hmac, ObjectMapper json) {
        super(hmac, json);
    }

    @Override public String code() { return CODE; }
}
