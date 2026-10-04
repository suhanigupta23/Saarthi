package com.saarthi.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AppointmentResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serializationDoesNotExposeAssociatedUserOrPassword() throws Exception {
        User user = new User("patient", "$2a$10$examplePasswordHash", "Patient Name");
        Appointment appointment = new Appointment(
                user,
                "APT-1234-BHOPAL",
                "node/123",
                "Dr. Neha Jain",
                "Gynecologist",
                "Saarthi Telehealth Clinic",
                "2 Oct 2026",
                "10:00 AM",
                "Online Video Call",
                "Booked",
                400,
                LocalDateTime.now()
        );

        String json = objectMapper.writeValueAsString(AppointmentResponse.from(appointment));

        assertTrue(json.contains("\"appointmentRef\":\"APT-1234-BHOPAL\""));
        assertTrue(json.contains("\"doctorName\":\"Dr. Neha Jain\""));
        assertFalse(json.contains("user"));
        assertFalse(json.contains("password"));
        assertFalse(json.contains("$2a$10$examplePasswordHash"));
        assertFalse(json.contains("patient"));
    }
}
