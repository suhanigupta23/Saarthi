package com.saarthi.controller;

import com.saarthi.dto.AppointmentResponse;
import com.saarthi.dto.CreateAppointmentRequest;
import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.UserRepository;
import com.saarthi.service.AppointmentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppointmentControllerTest {

    private final User authenticatedUser = new User("patient@example.com", "password-hash", "Patient");
    private final List<Appointment> storedAppointments = new ArrayList<>();
    private AppointmentController controller;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("patient@example.com", null)
        );

        AppointmentRepository appointmentRepository = repositoryProxy(AppointmentRepository.class, (method, args) -> {
            if ("saveAndFlush".equals(method)) {
                Appointment appointment = (Appointment) args[0];
                boolean duplicate = storedAppointments.stream().anyMatch(existing ->
                        existing.getProviderId().equals(appointment.getProviderId())
                                && existing.getDate().equals(appointment.getDate())
                                && existing.getTimeSlot().equals(appointment.getTimeSlot()));
                if (duplicate) {
                    throw new org.springframework.dao.DataIntegrityViolationException(
                            "uk_appointment_provider_date_time");
                }
                appointment.setId(42L);
                storedAppointments.add(appointment);
                return appointment;
            }
            if ("findByUserOrderByCreatedAtDesc".equals(method)) {
                assertSame(authenticatedUser, args[0]);
                return List.copyOf(storedAppointments);
            }
            throw new UnsupportedOperationException(method);
        });

        UserRepository userRepository = repositoryProxy(UserRepository.class, (method, args) -> {
            if ("findByUsername".equals(method)) {
                assertEquals("patient@example.com", args[0]);
                return Optional.of(authenticatedUser);
            }
            throw new UnsupportedOperationException(method);
        });

        controller = new AppointmentController(
                appointmentRepository,
                userRepository,
                new AppointmentService(appointmentRepository)
        );
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void bookingUsesAuthenticatedUserAndServerOwnedState() {
        CreateAppointmentRequest request = validRequest();

        ResponseEntity<?> response = controller.bookAppointment(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody() instanceof AppointmentResponse);
        AppointmentResponse body = (AppointmentResponse) response.getBody();
        assertEquals(42L, body.id());
        assertEquals("PENDING_PAYMENT", body.status());
        assertEquals(500, body.fee());
        assertTrue(body.appointmentRef().matches("APT-[A-F0-9]{8}"));

        assertEquals(1, storedAppointments.size());
        Appointment persisted = storedAppointments.get(0);
        assertSame(authenticatedUser, persisted.getUser());
        assertEquals(body.appointmentRef(), persisted.getAppointmentRef());
        assertEquals("PENDING_PAYMENT", persisted.getStatus());
        assertEquals(500, persisted.getFee());
        assertNotNull(persisted.getCreatedAt());
    }

    @Test
    void historyIsReadFromRepositoryForAuthenticatedUser() {
        controller.bookAppointment(validRequest());

        ResponseEntity<?> response = controller.getMyAppointments();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List<?>);
        List<?> history = (List<?>) response.getBody();
        assertEquals(1, history.size());
        assertTrue(history.get(0) instanceof AppointmentResponse);
    }

    @Test
    void invalidBookingIsNotPersisted() {
        CreateAppointmentRequest invalid = new CreateAppointmentRequest(
                "node/123", "", "Gynecologist", "Clinic", "2026-10-02",
                "Demo scheduling pending", "Online Video Call"
        );

        assertThrows(com.saarthi.exception.InvalidApiRequestException.class,
                () -> controller.bookAppointment(invalid));
        assertTrue(storedAppointments.isEmpty());
    }

    @Test
    void duplicateSlotReturnsConflict() {
        controller.bookAppointment(validRequest());

        assertThrows(AppointmentService.SlotAlreadyBookedException.class,
                () -> controller.bookAppointment(validRequest()));
        assertEquals(1, storedAppointments.size());
    }

    @Test
    void requestDtoContainsOnlyClientControlledFields() {
        List<String> fields = Arrays.stream(CreateAppointmentRequest.class.getRecordComponents())
                .map(component -> component.getName())
                .toList();

        assertEquals(List.of("providerId", "doctorName", "specialty", "clinicName", "date", "timeSlot", "mode"), fields);
    }

    private CreateAppointmentRequest validRequest() {
        return new CreateAppointmentRequest(
                "node/123",
                "Bhopal Women's Clinic",
                "gynaecology",
                "Bhopal, Madhya Pradesh",
                "2026-10-02",
                "Demo scheduling pending",
                "Online Video Call"
        );
    }

    @FunctionalInterface
    private interface RepositoryCall {
        Object invoke(String method, Object[] args);
    }

    @SuppressWarnings("unchecked")
    private static <T> T repositoryProxy(Class<T> repositoryType, RepositoryCall call) {
        return (T) Proxy.newProxyInstance(
                repositoryType.getClassLoader(),
                new Class<?>[]{repositoryType},
                (proxy, method, args) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        return switch (method.getName()) {
                            case "toString" -> repositoryType.getSimpleName() + "TestProxy";
                            case "hashCode" -> System.identityHashCode(proxy);
                            case "equals" -> proxy == args[0];
                            default -> null;
                        };
                    }
                    return call.invoke(method.getName(), args == null ? new Object[0] : args);
                }
        );
    }
}
