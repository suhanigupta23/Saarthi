package com.saarthi.service;

import com.saarthi.dto.CreateAppointmentRequest;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.transaction.TransactionalTestExecutionListener;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@Import(AppointmentService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@TestExecutionListeners(
        listeners = {DependencyInjectionTestExecutionListener.class, TransactionalTestExecutionListener.class},
        mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS
)
class AppointmentConcurrencyIntegrationTest {

    private static final String PROVIDER_ID = "node/987654321";
    private static final String DATE = "2026-10-15";
    private static final String TIME_SLOT = "10:00-10:30";

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    private User user;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();
        user = userRepository.save(new User("concurrent@example.com", "hash", "Concurrent User"));
    }

    @Test
    void twentySimultaneousRequestsCreateExactlyOneAppointmentForSlot() throws Exception {
        int attempted = 20;
        ExecutorService executor = Executors.newFixedThreadPool(attempted);
        CountDownLatch ready = new CountDownLatch(attempted);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successful = new AtomicInteger();
        AtomicInteger conflicts = new AtomicInteger();
        AtomicInteger unexpectedFailures = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        CreateAppointmentRequest request = new CreateAppointmentRequest(
                PROVIDER_ID,
                "OSM Women's Clinic",
                "gynaecology",
                "Bhopal",
                DATE,
                TIME_SLOT,
                "Online Video Call"
        );

        try {
            for (int attempt = 0; attempt < attempted; attempt++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    try {
                        start.await();
                        appointmentService.book(user, request);
                        successful.incrementAndGet();
                    } catch (AppointmentService.SlotAlreadyBookedException exception) {
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

        long databaseRowsForSlot = appointmentRepository.countByProviderIdAndDateAndTimeSlot(
                PROVIDER_ID, DATE, TIME_SLOT);

        assertEquals(1, successful.get());
        assertEquals(0, unexpectedFailures.get());
        assertEquals(1, databaseRowsForSlot);
        assertEquals(attempted, successful.get() + conflicts.get() + unexpectedFailures.get());

        System.out.printf(
                "BOOKING_CONCURRENCY_EXPERIMENT attempted=%d successful=%d conflicts=%d unexpectedFailures=%d databaseRowsForSlot=%d%n",
                attempted, successful.get(), conflicts.get(), unexpectedFailures.get(), databaseRowsForSlot);
    }
}
