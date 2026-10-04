package com.saarthi.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class StripeSdkWebhookVerifier implements StripeWebhookVerifier {

    private final String webhookSecret;

    public StripeSdkWebhookVerifier(@Value("${stripe.webhook-secret:}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @Override
    public VerifiedStripeEvent verify(String payload, String signatureHeader) {
        if (webhookSecret.isBlank()) {
            throw new MalformedWebhookException("STRIPE_WEBHOOK_SECRET is not configured");
        }

        final Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException exception) {
            throw new InvalidWebhookSignatureException("Invalid Stripe webhook signature", exception);
        } catch (Exception exception) {
            throw new MalformedWebhookException("Invalid Stripe webhook payload", exception);
        }

        if (event.getId() == null || event.getType() == null) {
            throw new MalformedWebhookException("Stripe event ID and type are required");
        }

        if (!event.getType().startsWith("checkout.session.")) {
            return new VerifiedStripeEvent(event.getId(), event.getType(), null, null, null, Map.of());
        }

        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(stripeObject instanceof Session session)) {
            throw new MalformedWebhookException("Stripe checkout event does not contain a Checkout Session");
        }

        return new VerifiedStripeEvent(
                event.getId(),
                event.getType(),
                session.getId(),
                session.getClientReferenceId(),
                session.getPaymentStatus(),
                session.getMetadata() == null ? Map.of() : Map.copyOf(session.getMetadata())
        );
    }
}
