package com.clipupp.affiliates.application;

import com.clipupp.common.error.ApiException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Resolves {@link NetworkAdapter} implementations by their network code.
 * Spring auto-discovers all adapters from the application context; this
 * registry just indexes them and complains loudly if two adapters claim the
 * same code.
 */
@Component
public class NetworkAdapterRegistry {

    private static final Logger log = LoggerFactory.getLogger(NetworkAdapterRegistry.class);

    private final Map<String, NetworkAdapter> byCode;

    public NetworkAdapterRegistry(List<NetworkAdapter> adapters) {
        Map<String, NetworkAdapter> map = new HashMap<>();
        for (NetworkAdapter a : adapters) {
            NetworkAdapter prev = map.put(a.code(), a);
            if (prev != null) {
                throw new IllegalStateException("Duplicate NetworkAdapter for code '" + a.code()
                        + "': " + prev.getClass() + " vs " + a.getClass());
            }
        }
        this.byCode = Map.copyOf(map);
        log.info("Registered affiliate network adapters: {}", byCode.keySet());
    }

    public Optional<NetworkAdapter> find(String code) {
        return Optional.ofNullable(byCode.get(code));
    }

    public NetworkAdapter require(String code) {
        return find(code).orElseThrow(() ->
                ApiException.notFound("Unknown affiliate network: " + code));
    }
}
