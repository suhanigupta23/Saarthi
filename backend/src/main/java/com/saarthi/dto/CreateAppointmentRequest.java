package com.saarthi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateAppointmentRequest(
        @NotBlank(message = "Provider identity is required")
        String providerId,
        @NotBlank(message = "Provider name is required")
        String doctorName,
        @NotBlank(message = "Specialty is required")
        String specialty,
        @NotBlank(message = "Clinic or provider address is required")
        String clinicName,
        @NotBlank(message = "Appointment date is required")
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Appointment date must use ISO format YYYY-MM-DD")
        String date,
        @NotBlank(message = "Appointment time is required")
        String timeSlot,
        @NotBlank(message = "Consultation mode is required")
        @Pattern(regexp = "Online Video Call|Visit Doctor Nearby", message = "Unsupported consultation mode")
        String mode
) {
}
