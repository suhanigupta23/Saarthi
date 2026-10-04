package com.saarthi.controller;

import com.saarthi.dto.CheckoutSessionResponse;
import com.saarthi.dto.CreateCheckoutRequest;
import com.saarthi.service.PaymentService;
import com.saarthi.service.StripeWebhookVerifier;
import com.saarthi.service.VerifiedStripeEvent;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeWebhookVerifier webhookVerifier;

    public PaymentController(PaymentService paymentService, StripeWebhookVerifier webhookVerifier) {
        this.paymentService = paymentService;
        this.webhookVerifier = webhookVerifier;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutRequest request,
            Authentication authentication) {
        CheckoutSessionResponse response = paymentService.createCheckout(
                authentication.getName(), request.appointmentRef());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        VerifiedStripeEvent event = webhookVerifier.verify(payload, signatureHeader);
        PaymentService.WebhookOutcome outcome = paymentService.processVerifiedWebhook(event);
        return ResponseEntity.ok(Map.of("result", outcome.name()));
    }
}
