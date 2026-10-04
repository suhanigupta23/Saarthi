package com.saarthi.service;

import java.util.Map;

public interface StripeCheckoutClient {

    CheckoutResult createCheckout(CheckoutCommand command) throws Exception;

    record CheckoutCommand(
            String appointmentRef,
            String productName,
            long amountInPaise,
            String currency,
            Map<String, String> metadata,
            String idempotencyKey
    ) {
    }

    record CheckoutResult(String sessionId, String checkoutUrl) {
    }
}
