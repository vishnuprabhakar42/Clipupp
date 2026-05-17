package com.couponvalley.conversions.api;

import com.couponvalley.conversions.application.PostbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/postback", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "postback", description = "Inbound conversion postbacks from affiliate networks")
@SecurityRequirements
public class PostbackController {

    private final PostbackService postbackService;

    public PostbackController(PostbackService postbackService) {
        this.postbackService = postbackService;
    }

    @PostMapping("/{network}")
    @Operation(summary = "Receive a conversion postback",
            description = "Verifies HMAC signature and timestamp, then idempotently records " +
                    "(or transitions) a Conversion row keyed by (network, network_txn_id).")
    public ResponseEntity<Map<String, Object>> postback(@PathVariable("network") String network,
                                                        HttpServletRequest request) throws IOException {
        byte[] body = request.getInputStream().readAllBytes();
        PostbackService.IngestResult result = postbackService.ingest(network, request, body);
        return ResponseEntity
                .status(result.idempotentDuplicate() ? HttpStatus.OK : HttpStatus.ACCEPTED)
                .body(Map.of(
                        "duplicate", result.idempotentDuplicate(),
                        "state", result.state().name()));
    }
}
