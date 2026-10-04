package com.saarthi.service;

import com.saarthi.dto.CheckoutSessionResponse;
import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.ProcessedStripeEventRepository;
import com.saarthi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.transaction.TransactionalTestExecutionListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(PaymentServiceIntegrationTest.TestConfig.class)
@TestExecutionListeners(
        listeners = {DependencyInjectionTestExecutionListener.class, TransactionalTestExecutionListener.class},
        mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS
)
class PaymentServiceIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProcessedStripeEventRepository processedEventRepository;

    @Autowired
    private CapturingStripeCheckoutClient stripeClient;

    private User owner;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(new User("owner@example.com", "hash", "Owner"));
        appointment = appointmentRepository.save(new Appointment(
                owner,
                "APT-PAYMENT1",
                "node/payment-1",
                "Bhopal Women's Clinic",
                "gynaecology",
                "Bhopal",
                "2 Oct 2026",
                "Demo scheduling pending",
                "Online Video Call",
                PaymentService.PENDING_PAYMENT,
                500,
                LocalDateTime.now()
        ));
        stripeClient.reset();
    }

    @Test
    void checkoutLoadsOwnedAppointmentAndUsesServerControlledStripeData() {
        CheckoutSessionResponse response = paymentService.createCheckout(
                owner.getUsername(), appointment.getAppointmentRef());

        StripeCheckoutClient.CheckoutCommand command = stripeClient.commands.get(0);
        assertEquals(50_000L, command.amountInPaise());
        assertEquals("inr", command.currency());
        assertEquals(appointment.getAppointmentRef(), command.appointmentRef());
        assertEquals(appointment.getAppointmentRef(), command.metadata().get("appointmentRef"));
        assertEquals(appointment.getId().toString(), command.metadata().get("appointmentId"));
        assertEquals("appointment-checkout-" + appointment.getId(), command.idempotencyKey());
        assertEquals("cs_test_payment1", response.sessionId());
        assertEquals("cs_test_payment1",
                appointmentRepository.findById(appointment.getId()).orElseThrow().getStripeCheckoutSessionId());
    }

    @Test
    void checkoutCannotBeCreatedForAnotherUsersAppointment() {
        User otherUser = userRepository.save(new User("other@example.com", "hash", "Other"));

        assertThrows(PaymentService.PaymentAccessDeniedException.class,
                () -> paymentService.createCheckout(otherUser.getUsername(), appointment.getAppointmentRef()));
        assertEquals(0, stripeClient.commands.size());
    }

    @Test
    void checkoutRejectsUnknownAppointment() {
        assertThrows(PaymentService.PaymentNotFoundException.class,
                () -> paymentService.createCheckout(owner.getUsername(), "APT-DOES-NOT-EXIST"));
        assertEquals(0, stripeClient.commands.size());
    }

    @Test
    void checkoutRejectsWrongAppointmentState() {
        appointment.setStatus(PaymentService.CONFIRMED);
        appointmentRepository.save(appointment);

        assertThrows(PaymentService.InvalidPaymentStateException.class,
                () -> paymentService.createCheckout(owner.getUsername(), appointment.getAppointmentRef()));
        assertEquals(0, stripeClient.commands.size());
    }

    @Test
    void stripeApiFailureLeavesAppointmentPendingWithoutSessionId() {
        stripeClient.failure = new IllegalStateException("Stripe unavailable");

        assertThrows(PaymentService.StripeCheckoutException.class,
                () -> paymentService.createCheckout(owner.getUsername(), appointment.getAppointmentRef()));

        Appointment unchanged = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertEquals(PaymentService.PENDING_PAYMENT, unchanged.getStatus());
        assertNull(unchanged.getStripeCheckoutSessionId());
    }

    @Test
    void successfulVerifiedWebhookConfirmsCorrectAppointmentAndPersistsEvent() {
        appointment.setStripeCheckoutSessionId("cs_test_payment1");
        appointmentRepository.save(appointment);

        PaymentService.WebhookOutcome outcome = paymentService.processVerifiedWebhook(successEvent("evt_success"));

        Appointment updated = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertEquals(PaymentService.WebhookOutcome.CONFIRMED, outcome);
        assertEquals(PaymentService.CONFIRMED, updated.getStatus());
        assertNotNull(updated.getConfirmedAt());
        assertEquals(1, processedEventRepository.count());
        assertEquals("evt_success", processedEventRepository.findAll().get(0).getEventId());
    }

    @Test
    void unknownAppointmentIsRejectedWithoutRecordingEvent() {
        VerifiedStripeEvent unknown = new VerifiedStripeEvent(
                "evt_unknown", "checkout.session.completed", "cs_unknown",
                "APT-UNKNOWN", "paid", Map.of("appointmentRef", "APT-UNKNOWN")
        );

        assertThrows(PaymentService.WebhookReconciliationException.class,
                () -> paymentService.processVerifiedWebhook(unknown));
        assertEquals(0, processedEventRepository.count());
        assertEquals(PaymentService.PENDING_PAYMENT,
                appointmentRepository.findById(appointment.getId()).orElseThrow().getStatus());
    }

    @Test
    void sameStripeEventDeliveredTwentyTimesTransitionsExactlyOnce() {
        appointment.setStripeCheckoutSessionId("cs_test_payment1");
        appointmentRepository.saveAndFlush(appointment);
        VerifiedStripeEvent event = successEvent("evt_repeated_20_times");

        int attemptedDeliveries = 20;
        int confirmationTransitions = 0;
        int duplicateAcknowledgements = 0;
        for (int delivery = 0; delivery < attemptedDeliveries; delivery++) {
            PaymentService.WebhookOutcome outcome = paymentService.processVerifiedWebhook(event);
            if (outcome == PaymentService.WebhookOutcome.CONFIRMED) confirmationTransitions++;
            if (outcome == PaymentService.WebhookOutcome.DUPLICATE) duplicateAcknowledgements++;
        }

        long processedEventRows = processedEventRepository.count();
        assertEquals(1, confirmationTransitions);
        assertEquals(19, duplicateAcknowledgements);
        assertEquals(1, processedEventRows);
        assertEquals(PaymentService.CONFIRMED,
                appointmentRepository.findById(appointment.getId()).orElseThrow().getStatus());

        System.out.printf(
                "IDEMPOTENCY_EXPERIMENT attempted=%d uniqueEventIds=1 confirmations=%d processedRows=%d duplicateSideEffects=0 duplicatesAcknowledged=%d%n",
                attemptedDeliveries, confirmationTransitions, processedEventRows, duplicateAcknowledgements);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void simultaneousCheckoutRequestsCreateAtMostOneLogicalStripeSession() throws Exception {
        int attempted = 20;
        ExecutorService executor = Executors.newFixedThreadPool(attempted);
        CountDownLatch ready = new CountDownLatch(attempted);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successfulResponses = new AtomicInteger();
        AtomicInteger conflicts = new AtomicInteger();
        AtomicInteger unexpectedFailures = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        try {
            for (int attempt = 0; attempt < attempted; attempt++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    try {
                        start.await();
                        paymentService.createCheckout(owner.getUsername(), appointment.getAppointmentRef());
                        successfulResponses.incrementAndGet();
                    } catch (PaymentService.InvalidPaymentStateException exception) {
                        conflicts.incrementAndGet();
                    } catch (Exception exception) {
                        unexpectedFailures.incrementAndGet();
                    }
                }));
            }

            ready.await(10, TimeUnit.SECONDS);
            start.countDown();
            for (Future<?> future : futures) {
                future.get(20, TimeUnit.SECONDS);
            }
        } finally {
            executor.shutdownNow();
        }

        int stripeCreateCalls = stripeClient.commands.size();
        Set<String> uniqueIdempotencyKeys = new HashSet<>();
        stripeClient.commands.forEach(command -> uniqueIdempotencyKeys.add(command.idempotencyKey()));
        int uniqueLogicalSessions = stripeClient.logicalSessions.size();
        Appointment stored = appointmentRepository.findById(appointment.getId()).orElseThrow();
        int storedCheckoutSessionIds = stored.getStripeCheckoutSessionId() == null ? 0 : 1;

        assertEquals(0, unexpectedFailures.get());
        assertEquals(1, uniqueIdempotencyKeys.size());
        assertEquals(1, uniqueLogicalSessions);
        assertEquals(1, storedCheckoutSessionIds);
        assertEquals(attempted, successfulResponses.get() + conflicts.get() + unexpectedFailures.get());

        System.out.printf(
                "CHECKOUT_CONCURRENCY_EXPERIMENT attempted=%d successfulResponses=%d conflicts=%d unexpectedFailures=%d stripeCreateCalls=%d uniqueIdempotencyKeys=%d uniqueLogicalSessions=%d storedCheckoutSessionIds=%d%n",
                attempted, successfulResponses.get(), conflicts.get(), unexpectedFailures.get(),
                stripeCreateCalls, uniqueIdempotencyKeys.size(), uniqueLogicalSessions, storedCheckoutSessionIds);
    }

    private VerifiedStripeEvent successEvent(String eventId) {
        return new VerifiedStripeEvent(
                eventId,
                "checkout.session.completed",
                "cs_test_payment1",
                appointment.getAppointmentRef(),
                "paid",
                Map.of("appointmentRef", appointment.getAppointmentRef())
        );
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        CapturingStripeCheckoutClient stripeCheckoutClient() {
            return new CapturingStripeCheckoutClient();
        }

        @Bean
        PaymentService paymentService(
                AppointmentRepository appointmentRepository,
                UserRepository userRepository,
                ProcessedStripeEventRepository processedEventRepository,
                CapturingStripeCheckoutClient stripeCheckoutClient) {
            return new PaymentService(
                    appointmentRepository, userRepository, processedEventRepository, stripeCheckoutClient);
        }
    }

    static class CapturingStripeCheckoutClient implements StripeCheckoutClient {
        private final List<CheckoutCommand> commands = Collections.synchronizedList(new ArrayList<>());
        private final Map<String, CheckoutResult> logicalSessions = new ConcurrentHashMap<>();
        private RuntimeException failure;

        @Override
        public CheckoutResult createCheckout(CheckoutCommand command) {
            commands.add(command);
            if (failure != null) throw failure;
            return logicalSessions.computeIfAbsent(
                    command.idempotencyKey(),
                    ignored -> new CheckoutResult("cs_test_payment1", "https://checkout.stripe.test/session")
            );
        }

        void reset() {
            commands.clear();
            logicalSessions.clear();
            failure = null;
        }
    }
}
