package com.clipupp.conversions.application;

import com.clipupp.affiliates.application.NetworkAdapter;
import com.clipupp.affiliates.application.NetworkAdapterRegistry;
import com.clipupp.affiliates.domain.AffiliateNetwork;
import com.clipupp.affiliates.infra.AffiliateNetworkRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.error.ErrorCode;
import com.clipupp.conversions.domain.Conversion;
import com.clipupp.conversions.domain.ConversionState;
import com.clipupp.conversions.infra.ConversionRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostbackService {

    private static final Logger log = LoggerFactory.getLogger(PostbackService.class);

    private final NetworkAdapterRegistry registry;
    private final AffiliateNetworkRepository networkRepo;
    private final ConversionRepository conversionRepo;
    private final NetworkSecretResolver secretResolver;
    private final AuditLogService audit;

    public PostbackService(NetworkAdapterRegistry registry,
                           AffiliateNetworkRepository networkRepo,
                           ConversionRepository conversionRepo,
                           NetworkSecretResolver secretResolver,
                           AuditLogService audit) {
        this.registry = registry;
        this.networkRepo = networkRepo;
        this.conversionRepo = conversionRepo;
        this.secretResolver = secretResolver;
        this.audit = audit;
    }

    public record IngestResult(boolean idempotentDuplicate, ConversionState state) {}

    @Transactional
    public IngestResult ingest(String networkCode, HttpServletRequest request, byte[] body) {
        AffiliateNetwork network = networkRepo.findByCode(networkCode)
                .orElseThrow(() -> ApiException.notFound("Unknown network: " + networkCode));
        if (!network.isActive()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.UNAUTHORIZED,
                    "Network is currently inactive");
        }

        NetworkAdapter adapter = registry.require(networkCode);
        String secret = secretResolver.requireSecret(network);
        adapter.verifyPostback(request, body, secret);

        NetworkAdapter.Postback parsed;
        try {
            parsed = adapter.parsePostback(body);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED,
                    "Could not parse postback body: " + ex.getMessage());
        }

        // Idempotency on (network, txn_id).
        Optional<Conversion> existing = conversionRepo.findByNetworkIdAndNetworkTxnId(
                network.getId(), parsed.networkTxnId());
        if (existing.isPresent()) {
            ConversionState newState = mapState(parsed.status());
            ConversionState before = existing.get().getState();
            if (before != newState) {
                existing.get().transition(newState);
                audit.record(null, "CONVERSION_TRANSITION", "conversion",
                        existing.get().getId(),
                        Map.of("from", before.name(), "to", newState.name(),
                                "network", networkCode, "txnId", parsed.networkTxnId()));
            }
            return new IngestResult(true, newState);
        }

        Conversion conversion = Conversion.create(
                network.getId(),
                parsed.networkTxnId(),
                parsed.clickId(),
                parsed.orderAmount(),
                parsed.orderCurrency(),
                parsed.commissionAmount(),
                parsed.commissionCurrency(),
                parsed.rawJson(),
                parsed.reportedAt());
        ConversionState initialState = mapState(parsed.status());
        if (initialState != ConversionState.PENDING) conversion.transition(initialState);
        conversionRepo.save(conversion);

        log.info("postback ingested network={} txnId={} state={} clickId={}",
                networkCode, parsed.networkTxnId(), initialState, parsed.clickId());
        audit.record(null, "CONVERSION_INGEST", "conversion", conversion.getId(),
                Map.of("network", networkCode, "txnId", parsed.networkTxnId(),
                        "state", initialState.name()));

        return new IngestResult(false, initialState);
    }

    private static ConversionState mapState(NetworkAdapter.ConversionStatusHint hint) {
        return switch (hint) {
            case APPROVED -> ConversionState.APPROVED;
            case REJECTED -> ConversionState.REJECTED;
            case REVERSED -> ConversionState.REVERSED;
            default -> ConversionState.PENDING;
        };
    }
}
