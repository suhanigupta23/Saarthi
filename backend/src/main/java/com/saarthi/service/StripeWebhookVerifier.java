package com.saarthi.service;

public interface StripeWebhookVerifier {

    VerifiedStripeEvent verify(String payload, String signatureHeader);

    class InvalidWebhookSignatureException extends RuntimeException {
        public InvalidWebhookSignatureException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    class MalformedWebhookException extends RuntimeException {
        public MalformedWebhookException(String message, Throwable cause) {
            super(message, cause);
        }

        public MalformedWebhookException(String message) {
            super(message);
        }
    }
}
