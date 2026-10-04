package com.saarthi.dto;

public record CheckoutSessionResponse(
        String checkoutUrl,
        String sessionId,
        String appointmentRef
) {
}
