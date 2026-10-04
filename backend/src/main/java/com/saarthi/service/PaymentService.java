package com.saarthi.service;

import com.saarthi.dto.CheckoutSessionResponse;
import com.saarthi.model.Appointment;
import com.saarthi.model.ProcessedStripeEvent;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.ProcessedStripeEventRepository;
import com.saarthi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class PaymentService {

    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";
    public static final String CONFIRMED = "CONFIRMED";
    private static final long DEMO_AMOUNT_IN_PAISE = 50_000L;

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ProcessedStripeEventRepository processedEventRepository;
    private final StripeCheckoutClient stripeCheckoutClient;

    public PaymentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            ProcessedStripeEventRepository processedEventRepository,
            StripeCheckoutClient stripeCheckoutClient) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.processedEventRepository = processedEventRepository;
        this.stripeCheckoutClient = stripeCheckoutClient;
    }

    @Transactional
    public CheckoutSessionResponse createCheckout(String username, String appointmentRef) {
        if (appointmentRef == null || appointmentRef.isBlank()) {
            throw new InvalidPaymentRequestException("Appointment reference is required");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new PaymentNotFoundException("Authenticated user was not found"));
        Appointment appointment = appointmentRepository.findByAppointmentRef(appointmentRef)
                .orElseThrow(() -> new PaymentNotFoundException("Appointment was not found"));
        if (!appointment.getUser().getId().equals(user.getId())) {
            throw new PaymentAccessDeniedException("You do not have permission to pay for this appointment");
        }

        if (!PENDING_PAYMENT.equals(appointment.getStatus())) {
            throw new InvalidPaymentStateException("Only pending appointments can start checkout");
        }
        if (appointment.getStripeCheckoutSessionId() != null) {
            throw new InvalidPaymentStateException("Checkout already exists for this appointment");
        }

        StripeCheckoutClient.CheckoutCommand command = new StripeCheckoutClient.CheckoutCommand(
                appointment.getAppointmentRef(),
                "Saarthi demo consultation with " + appointment.getDoctorName(),
                DEMO_AMOUNT_IN_PAISE,
                "inr",
                Map.of(
                        "appointmentRef", appointment.getAppointmentRef(),
                        "appointmentId", appointment.getId().toString()
                ),
                "appointment-checkout-" + appointment.getId()
        );

        final StripeCheckoutClient.CheckoutResult stripeResult;
        try {
            stripeResult = stripeCheckoutClient.createCheckout(command);
        } catch (Exception exception) {
            throw new StripeCheckoutException("Stripe Checkout could not be created", exception);
        }

        if (stripeResult.sessionId() == null || stripeResult.checkoutUrl() == null) {
            throw new StripeCheckoutException("Stripe returned an incomplete Checkout Session", null);
        }
        appointment.setStripeCheckoutSessionId(stripeResult.sessionId());
        appointmentRepository.save(appointment);
        return new CheckoutSessionResponse(
                stripeResult.checkoutUrl(),
                stripeResult.sessionId(),
                appointment.getAppointmentRef()
        );
    }

    @Transactional
    public WebhookOutcome processVerifiedWebhook(VerifiedStripeEvent event) {
        if (event.eventId() == null || event.eventId().isBlank()) {
            throw new WebhookReconciliationException("Stripe event ID is required");
        }
        if (processedEventRepository.existsById(event.eventId())) {
            return WebhookOutcome.DUPLICATE;
        }

        WebhookOutcome outcome = WebhookOutcome.IGNORED;
        boolean successfulCheckout = ("checkout.session.completed".equals(event.eventType())
                || "checkout.session.async_payment_succeeded".equals(event.eventType()))
                && "paid".equals(event.paymentStatus());

        if (successfulCheckout) {
            String appointmentRef = event.metadata().getOrDefault("appointmentRef", event.clientReferenceId());
            if (appointmentRef == null || appointmentRef.isBlank()) {
                throw new WebhookReconciliationException("Stripe event has no appointment reference");
            }

            Appointment appointment = appointmentRepository.findByAppointmentRef(appointmentRef)
                    .orElseThrow(() -> new WebhookReconciliationException("Unknown appointment reference"));
            if (event.sessionId() == null
                    || !event.sessionId().equals(appointment.getStripeCheckoutSessionId())) {
                throw new WebhookReconciliationException("Stripe session does not match the appointment");
            }

            if (PENDING_PAYMENT.equals(appointment.getStatus())) {
                appointment.setStatus(CONFIRMED);
                appointment.setConfirmedAt(LocalDateTime.now());
                appointmentRepository.save(appointment);
                outcome = WebhookOutcome.CONFIRMED;
            } else if (CONFIRMED.equals(appointment.getStatus())) {
                outcome = WebhookOutcome.ALREADY_CONFIRMED;
            } else {
                throw new WebhookReconciliationException("Appointment is not in a payable state");
            }
        }

        processedEventRepository.saveAndFlush(new ProcessedStripeEvent(event.eventId(), LocalDateTime.now()));
        return outcome;
    }

    public enum WebhookOutcome {
        CONFIRMED,
        ALREADY_CONFIRMED,
        DUPLICATE,
        IGNORED
    }

    public static class InvalidPaymentRequestException extends RuntimeException {
        public InvalidPaymentRequestException(String message) { super(message); }
    }

    public static class PaymentNotFoundException extends RuntimeException {
        public PaymentNotFoundException(String message) { super(message); }
    }

    public static class PaymentAccessDeniedException extends AccessDeniedException {
        public PaymentAccessDeniedException(String message) { super(message); }
    }

    public static class InvalidPaymentStateException extends RuntimeException {
        public InvalidPaymentStateException(String message) { super(message); }
    }

    public static class StripeCheckoutException extends RuntimeException {
        public StripeCheckoutException(String message, Throwable cause) { super(message, cause); }
    }

    public static class WebhookReconciliationException extends RuntimeException {
        public WebhookReconciliationException(String message) { super(message); }
    }
}
