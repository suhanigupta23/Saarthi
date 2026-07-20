package com.saarthi.controller;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Value("${STRIPE_API_SECRET_KEY:sk_test_mockkey}")
    private String stripeSecretKey;

    @Value("${STRIPE_WEBHOOK_SECRET:whsec_mocksecret}")
    private String endpointSecret;

    // POST /api/payment/checkout -> Generates a billing checkout session url
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody Map<String, Object> requestData) {
        Stripe.apiKey = stripeSecretKey;
        Map<String, String> responseData = new HashMap<>();

        try {
            String doctorName = (String) requestData.getOrDefault("doctorName", "Clinical Consultation");
            Long amount = ((Number) requestData.getOrDefault("amount", 500)).longValue(); // amount in INR/Cents

            SessionCreateParams params = SessionCreateParams.builder()
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:5173/?payment=success")
                    .setCancelUrl("http://localhost:5173/?payment=cancel")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("inr")
                                    .setUnitAmount(amount * 100) // Stripe expects amount in paisa/cents
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("Consultation with " + doctorName)
                                            .build())
                                    .build())
                            .build())
                    .build();

            Session session = Session.create(params);
            responseData.put("checkoutUrl", session.getUrl());
            responseData.put("sessionId", session.getId());

            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            responseData.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseData);
        }
    }

    // POST /api/payment/webhook -> Endpoint for Stripe event reports
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Stripe.apiKey = stripeSecretKey;
        Event event = null;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            System.err.println("Webhook Signature Verification Failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid Signature");
        } catch (Exception e) {
            System.err.println("Webhook Payload Parsing Failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid Payload");
        }

        // Handle the event
        String eventType = event.getType();
        if ("checkout.session.completed".equals(eventType)) {
            System.out.println("Payment checkout session succeeded! Updating database status...");
            // Extract session metadata and update DB entries
        } else {
            System.out.println("Unhandled event type: " + eventType);
        }

        return ResponseEntity.ok("Event received and verified");
    }
}
