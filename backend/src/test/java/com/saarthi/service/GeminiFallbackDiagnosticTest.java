package com.saarthi.service;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.dto.SymptomAnalysisResponse;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GeminiFallbackDiagnosticTest {

    private static final String PRIVATE_SYMPTOM = "private-patient-symptom";
    private static final String PRIVATE_CONTENT = "private-prompt-or-response-content";
    private final GeminiService service = new GeminiService(prompt -> "unused", new ObjectMapper());

    @Test
    void classifiesHttp429WithoutLoggingResponseBodyOrSymptoms() {
        HttpClientErrorException upstreamFailure = HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                HttpHeaders.EMPTY,
                PRIVATE_CONTENT.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );
        Throwable failure = new GeminiHttpClient.GeminiClientException(
                "Gemini request failed", upstreamFailure);

        CapturedFallback captured = captureFallback(failure);

        assertEquals(
                "GEMINI_FALLBACK reason=HTTP_429 httpStatus=429 exception=GeminiClientException",
                captured.logMessage());
        assertNoSensitiveContent(captured.logMessage());
    }

    @Test
    void classifiesTimeout() {
        Throwable failure = new GeminiHttpClient.GeminiClientException(
                "Gemini request failed",
                new ResourceAccessException(
                        PRIVATE_CONTENT,
                        new SocketTimeoutException("read timed out")
                )
        );

        CapturedFallback captured = captureFallback(failure);

        assertEquals(
                "GEMINI_FALLBACK reason=CONNECT_OR_READ_TIMEOUT httpStatus=none exception=GeminiClientException",
                captured.logMessage());
        assertNoSensitiveContent(captured.logMessage());
    }

    @Test
    void classifiesOpenCircuit() {
        CircuitBreaker circuitBreaker = CircuitBreaker.ofDefaults("diagnostic-test");
        circuitBreaker.transitionToOpenState();
        Throwable failure = CallNotPermittedException.createCallNotPermittedException(circuitBreaker);

        CapturedFallback captured = captureFallback(failure);

        assertEquals(
                "GEMINI_FALLBACK reason=CIRCUIT_OPEN httpStatus=none exception=CallNotPermittedException",
                captured.logMessage());
        assertNoSensitiveContent(captured.logMessage());
    }

    @Test
    void classifiesInvalidGeneratedJson() {
        Throwable failure = new GeminiService.InvalidGeminiResponseException(
                "Gemini returned malformed guidance",
                new IllegalArgumentException(PRIVATE_CONTENT)
        );

        CapturedFallback captured = captureFallback(failure);

        assertEquals(
                "GEMINI_FALLBACK reason=OUTPUT_JSON_INVALID httpStatus=none exception=InvalidGeminiResponseException",
                captured.logMessage());
        assertNoSensitiveContent(captured.logMessage());
    }

    @Test
    void preservesExistingFallbackResponseExactly() {
        CapturedFallback captured = captureFallback(new RuntimeException(PRIVATE_CONTENT));
        SymptomAnalysisResponse response = captured.response();

        assertEquals("AI assessment unavailable", response.predictedCondition());
        assertEquals(0.0, response.confidence());
        assertEquals("Unknown", response.urgency());
        assertEquals("Qualified healthcare professional", response.recommendedSpecialist());
        assertEquals(List.of(
                "Which symptoms should I monitor or record?",
                "When should I seek an in-person medical evaluation?"
        ), response.doctorQuestions());
        assertEquals(
                "Track when symptoms occur and whether they are worsening. Seek professional care for persistent or concerning symptoms. For severe pain, very heavy bleeding, fainting, chest pain, or difficulty breathing, seek urgent medical help.",
                response.homeCare());
        assertEquals(SymptomAnalysisResponse.Source.FALLBACK, response.source());
        assertEquals(
                "Educational guidance only; this is not a diagnosis or a substitute for professional medical care.",
                response.disclaimer());
        assertEquals(
                "GEMINI_FALLBACK reason=UNEXPECTED httpStatus=none exception=RuntimeException",
                captured.logMessage());
        assertNoSensitiveContent(captured.logMessage());
    }

    private CapturedFallback captureFallback(Throwable failure) {
        Logger logger = (Logger) LoggerFactory.getLogger(GeminiService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            SymptomAnalysisResponse response = service.fallbackSymptomAnalysis(
                    List.of(PRIVATE_SYMPTOM), failure);
            assertEquals(1, appender.list.size(), "Fallback must emit exactly one diagnostic warning");
            return new CapturedFallback(response, appender.list.get(0).getFormattedMessage());
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    private void assertNoSensitiveContent(String logMessage) {
        assertFalse(logMessage.contains(PRIVATE_SYMPTOM));
        assertFalse(logMessage.contains(PRIVATE_CONTENT));
        assertFalse(logMessage.contains("x-goog-api-key"));
        assertFalse(logMessage.contains("Bearer"));
    }

    private record CapturedFallback(
            SymptomAnalysisResponse response,
            String logMessage
    ) {
    }
}
