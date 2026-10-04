package com.saarthi.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.dto.SymptomAnalysisResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class GeminiService {

    public static final String CIRCUIT_BREAKER_NAME = "geminiCircuit";
    private static final String DISCLAIMER =
            "Educational guidance only; this is not a diagnosis or a substitute for professional medical care.";
    private static final Set<String> ALLOWED_URGENCY = Set.of("Low", "Medium", "High");

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public GeminiService(GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @CircuitBreaker(name = CIRCUIT_BREAKER_NAME, fallbackMethod = "fallbackSymptomAnalysis")
    public SymptomAnalysisResponse analyzeSymptoms(List<String> symptoms) {
        String rawJson = geminiClient.generateContent(buildPrompt(symptoms));
        GeminiPayload payload = parseAndValidate(stripCodeFence(rawJson));
        return new SymptomAnalysisResponse(
                payload.predictedCondition(),
                payload.confidence(),
                payload.urgency(),
                payload.recommendedSpecialist(),
                List.copyOf(payload.doctorQuestions()),
                payload.homeCare(),
                SymptomAnalysisResponse.Source.GEMINI,
                DISCLAIMER
        );
    }

    public SymptomAnalysisResponse fallbackSymptomAnalysis(List<String> symptoms, Throwable failure) {
        return new SymptomAnalysisResponse(
                "AI assessment unavailable",
                0.0,
                "Unknown",
                "Qualified healthcare professional",
                List.of(
                        "Which symptoms should I monitor or record?",
                        "When should I seek an in-person medical evaluation?"
                ),
                "Track when symptoms occur and whether they are worsening. Seek professional care for persistent or concerning symptoms. For severe pain, very heavy bleeding, fainting, chest pain, or difficulty breathing, seek urgent medical help.",
                SymptomAnalysisResponse.Source.FALLBACK,
                DISCLAIMER
        );
    }

    private String buildPrompt(List<String> symptoms) {
        return "Provide general educational women's-health guidance for these reported symptoms: "
                + String.join(", ", symptoms) + ". Do not present the result as a diagnosis or medically validated conclusion. "
                + "Return only one JSON object with these exact keys: "
                + "'predicted_condition' (a cautious possible pattern, String), "
                + "'confidence' (Double from 0.0 to 1.0), "
                + "'urgency' (Low, Medium, or High), "
                + "'recommended_specialist' (String), "
                + "'doctor_questions' (List of at most 3 Strings), "
                + "'home_care' (conservative general guidance, String). "
                + "Do not include markdown fences or extra text.";
    }

    private GeminiPayload parseAndValidate(String json) {
        final GeminiPayload payload;
        try {
            payload = objectMapper.readValue(json, GeminiPayload.class);
        } catch (JsonProcessingException exception) {
            throw new InvalidGeminiResponseException("Gemini returned malformed guidance", exception);
        }

        if (payload.predictedCondition() == null || payload.predictedCondition().isBlank()
                || payload.confidence() == null || payload.confidence() < 0 || payload.confidence() > 1
                || !ALLOWED_URGENCY.contains(payload.urgency())
                || payload.recommendedSpecialist() == null || payload.recommendedSpecialist().isBlank()
                || payload.doctorQuestions() == null || payload.doctorQuestions().size() > 3
                || payload.homeCare() == null || payload.homeCare().isBlank()) {
            throw new InvalidGeminiResponseException("Gemini guidance did not match the expected schema", null);
        }
        return payload;
    }

    private String stripCodeFence(String value) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
        return cleaned.trim();
    }

    private record GeminiPayload(
            @JsonProperty("predicted_condition") String predictedCondition,
            Double confidence,
            String urgency,
            @JsonProperty("recommended_specialist") String recommendedSpecialist,
            @JsonProperty("doctor_questions") List<String> doctorQuestions,
            @JsonProperty("home_care") String homeCare
    ) {
    }

    public static class InvalidGeminiResponseException extends RuntimeException {
        public InvalidGeminiResponseException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
