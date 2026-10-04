package com.saarthi.controller;

import com.saarthi.service.PaymentService;
import com.saarthi.service.StripeWebhookVerifier;
import com.saarthi.service.VerifiedStripeEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaymentControllerTest {

    @Test
    void invalidWebhookSignatureReturnsBadRequestWithoutReconciliation() {
        StubPaymentService paymentService = new StubPaymentService();
        StripeWebhookVerifier verifier = (payload, signature) -> {
            throw new StripeWebhookVerifier.InvalidWebhookSignatureException("forged", null);
        };
        PaymentController controller = new PaymentController(paymentService, verifier);

        assertThrows(StripeWebhookVerifier.InvalidWebhookSignatureException.class,
                () -> controller.handleStripeWebhook("{}", "forged"));
        assertEquals(0, paymentService.webhooksProcessed);
    }

    private static class StubPaymentService extends PaymentService {
        private int webhooksProcessed;

        private StubPaymentService() {
            super(null, null, null, null);
        }

        @Override
        public WebhookOutcome processVerifiedWebhook(VerifiedStripeEvent event) {
            webhooksProcessed++;
            return WebhookOutcome.CONFIRMED;
        }
    }
}
