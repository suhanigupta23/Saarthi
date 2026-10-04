package com.saarthi.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SymptomAnalysisRequest(
        @NotEmpty(message = "Select at least one symptom")
        @Size(max = 20, message = "Select no more than 20 symptoms")
        List<@Valid @NotBlank(message = "Symptoms must not be blank")
                @Size(max = 80, message = "Each symptom must be at most 80 characters") String> symptoms
) {
}
