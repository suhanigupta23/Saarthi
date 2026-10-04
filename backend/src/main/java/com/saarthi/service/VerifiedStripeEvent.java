package com.saarthi.service;

import java.util.Map;

public record VerifiedStripeEvent(
        String eventId,
        String eventType,
        String sessionId,
        String clientReferenceId,
        String paymentStatus,
        Map<String, String> metadata
) {
}
