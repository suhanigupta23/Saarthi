package com.saarthi.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.dto.SymptomAnalysisResponse;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.stereotype.Service;

import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeoutException;

@Service
public class GeminiService {

    private static final Logger LOGGER = LoggerFactory.getLogger(GeminiService.class);
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
        FallbackDiagnostic diagnostic = classifyFailure(failure);
        LOGGER.warn("GEMINI_FALLBACK reason={} httpStatus={} exception={}",
                diagnostic.reason(), diagnostic.httpStatus(), diagnostic.exceptionName());

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

    static FallbackDiagnostic classifyFailure(Throwable failure) {
        String exceptionName = failure == null ? "none" : failure.getClass().getSimpleName();

        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof CallNotPermittedException) {
                return new FallbackDiagnostic(FallbackReason.CIRCUIT_OPEN, "none", exceptionName);
            }
            if (current instanceof InvalidGeminiResponseException) {
                FallbackReason reason = "Gemini returned malformed guidance".equals(current.getMessage())
                        ? FallbackReason.OUTPUT_JSON_INVALID
                        : FallbackReason.OUTPUT_SCHEMA_INVALID;
                return new FallbackDiagnostic(reason, "none", exceptionName);
            }
            if (current instanceof GeminiHttpClient.GeminiClientException) {
                if ("Gemini API key is not configured".equals(current.getMessage())) {
                    return new FallbackDiagnostic(FallbackReason.API_KEY_MISSING, "none", exceptionName);
                }
                if ("Gemini returned an unexpected response".equals(current.getMessage())) {
                    return new FallbackDiagnostic(FallbackReason.UPSTREAM_RESPONSE_SHAPE, "none", exceptionName);
                }
            }
        }

        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof HttpStatusCodeException httpFailure) {
                int status = httpFailure.getStatusCode().value();
                FallbackReason reason = switch (status) {
                    case 400 -> FallbackReason.HTTP_400;
                    case 401 -> FallbackReason.HTTP_401;
                    case 403 -> FallbackReason.HTTP_403;
                    case 404 -> FallbackReason.HTTP_404;
                    case 429 -> FallbackReason.HTTP_429;
                    default -> status >= 500 && status <= 599
                            ? FallbackReason.HTTP_5XX
                            : FallbackReason.UNEXPECTED;
                };
                return new FallbackDiagnostic(reason, Integer.toString(status), exceptionName);
            }
        }

        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof SocketTimeoutException
                    || current instanceof TimeoutException
                    || current.getClass().getSimpleName().contains("Timeout")) {
                return new FallbackDiagnostic(
                        FallbackReason.CONNECT_OR_READ_TIMEOUT, "none", exceptionName);
            }
        }

        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof ResourceAccessException || current instanceof RestClientException) {
                return new FallbackDiagnostic(FallbackReason.TRANSPORT_FAILURE, "none", exceptionName);
            }
        }

        return new FallbackDiagnostic(FallbackReason.UNEXPECTED, "none", exceptionName);
    }

    enum FallbackReason {
        API_KEY_MISSING,
        HTTP_400,
        HTTP_401,
        HTTP_403,
        HTTP_404,
        HTTP_429,
        HTTP_5XX,
        CONNECT_OR_READ_TIMEOUT,
        TRANSPORT_FAILURE,
        UPSTREAM_RESPONSE_SHAPE,
        OUTPUT_JSON_INVALID,
        OUTPUT_SCHEMA_INVALID,
        CIRCUIT_OPEN,
        UNEXPECTED
    }

    record FallbackDiagnostic(FallbackReason reason, String httpStatus, String exceptionName) {
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
