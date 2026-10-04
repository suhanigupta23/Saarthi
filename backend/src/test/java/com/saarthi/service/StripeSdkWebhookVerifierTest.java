package com.saarthi.service;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StripeSdkWebhookVerifierTest {

    private static final String SECRET = "whsec_test_signing_secret";
    private static final String PAYLOAD = """
            {
              "id":"evt_signed_123",
              "object":"event",
              "api_version":"2023-10-16",
              "created":1727800000,
              "data":{"object":{
                "id":"cs_test_signed",
                "object":"checkout.session",
                "client_reference_id":"APT-SIGNED",
                "metadata":{"appointmentRef":"APT-SIGNED"},
                "payment_status":"paid"
              }},
              "livemode":false,
              "pending_webhooks":1,
              "type":"checkout.session.completed"
            }
            """;

    private final StripeSdkWebhookVerifier verifier = new StripeSdkWebhookVerifier(SECRET);

    @Test
    void validSignatureProducesTrustedCheckoutEvent() throws Exception {
        long timestamp = Instant.now().getEpochSecond();
        String signature = signature(timestamp, PAYLOAD, SECRET);

        VerifiedStripeEvent event = verifier.verify(PAYLOAD, signature);

        assertEquals("evt_signed_123", event.eventId());
        assertEquals("checkout.session.completed", event.eventType());
        assertEquals("cs_test_signed", event.sessionId());
        assertEquals("APT-SIGNED", event.clientReferenceId());
        assertEquals("APT-SIGNED", event.metadata().get("appointmentRef"));
        assertEquals("paid", event.paymentStatus());
    }

    @Test
    void invalidSignatureIsRejected() {
        long timestamp = Instant.now().getEpochSecond();

        assertThrows(StripeWebhookVerifier.InvalidWebhookSignatureException.class,
                () -> verifier.verify(PAYLOAD, "t=" + timestamp + ",v1=forged"));
    }

    private String signature(long timestamp, String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String digest = HexFormat.of().formatHex(
                mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8))
        );
        return "t=" + timestamp + ",v1=" + digest;
    }
}
