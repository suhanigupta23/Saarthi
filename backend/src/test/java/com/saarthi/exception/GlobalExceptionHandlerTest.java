package com.saarthi.exception;

import com.saarthi.dto.CreateCheckoutRequest;
import com.saarthi.service.AppointmentService;
import com.saarthi.service.OsmProviderService;
import com.saarthi.service.PaymentService;
import jakarta.validation.Valid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FailureController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void invalidDtoReturnsFieldErrorsInStandardShape() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentRef\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value("/test/validation"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.fieldErrors.appointmentRef")
                        .value("Appointment reference is required"));
    }

    @Test
    void slotConflictReturns409WithoutDatabaseDetails() throws Exception {
        mockMvc.perform(get("/test/slot-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("This consultation slot has already been booked."))
                .andExpect(content().string(not(containsString("SQLSTATE"))));
    }

    @Test
    void missingResourceReturns404() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Appointment was not found"));
    }

    @Test
    void unrelatedDatabaseConflictIsGenericAndDoesNotPretendToBeSlotConflict() throws Exception {
        mockMvc.perform(get("/test/data-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Request conflicts with existing data"))
                .andExpect(content().string(not(containsString("users_username_key"))))
                .andExpect(content().string(not(containsString("SQLSTATE"))));
    }

    @Test
    void upstreamProviderFailureReturnsSafe502() throws Exception {
        mockMvc.perform(get("/test/upstream"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.message")
                        .value("OpenStreetMap provider search is temporarily unavailable"))
                .andExpect(content().string(not(containsString("overpass-internal"))));
    }

    @Test
    void forbiddenRequestReturns403() throws Exception {
        mockMvc.perform(get("/test/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message")
                        .value("You do not have permission to access this resource"));
    }

    @Test
    void unexpectedFailureReturnsSafe500WithoutInternalDetails() throws Exception {
        mockMvc.perform(get("/test/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("An unexpected server error occurred"))
                .andExpect(content().string(not(containsString("jdbc:postgresql"))))
                .andExpect(content().string(not(containsString("secret-value"))));
    }

    @RestController
    @RequestMapping("/test")
    static class FailureController {

        @PostMapping("/validation")
        void validate(@Valid @RequestBody CreateCheckoutRequest request) {
        }

        @GetMapping("/slot-conflict")
        void slotConflict() {
            throw new AppointmentService.SlotAlreadyBookedException(
                    "This consultation slot has already been booked.",
                    new RuntimeException("SQLSTATE 23505"));
        }

        @GetMapping("/not-found")
        void notFound() {
            throw new PaymentService.PaymentNotFoundException("Appointment was not found");
        }

        @GetMapping("/data-conflict")
        void dataConflict() {
            throw new DataIntegrityViolationException(
                    "SQLSTATE 23505 constraint users_username_key secret-value");
        }

        @GetMapping("/upstream")
        void upstream() {
            throw new OsmProviderService.OsmProviderException(
                    "overpass-internal host failed", new RuntimeException("private endpoint"));
        }

        @GetMapping("/forbidden")
        void forbidden() {
            throw new PaymentService.PaymentAccessDeniedException(
                    "You do not have permission to pay for this appointment");
        }

        @GetMapping("/unexpected")
        void unexpected() {
            throw new RuntimeException("jdbc:postgresql://internal secret-value");
        }
    }
}
