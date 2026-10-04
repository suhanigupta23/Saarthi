package com.saarthi.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCheckoutRequest(
        @NotBlank(message = "Appointment reference is required")
        String appointmentRef
) {
}
