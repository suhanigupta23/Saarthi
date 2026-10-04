package com.saarthi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record SymptomAnalysisResponse(
        @JsonProperty("predicted_condition") String predictedCondition,
        double confidence,
        String urgency,
        @JsonProperty("recommended_specialist") String recommendedSpecialist,
        @JsonProperty("doctor_questions") List<String> doctorQuestions,
        @JsonProperty("home_care") String homeCare,
        Source source,
        String disclaimer
) {
    public enum Source {
        GEMINI,
        FALLBACK
    }
}
