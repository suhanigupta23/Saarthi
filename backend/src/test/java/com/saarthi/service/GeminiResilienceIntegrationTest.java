package com.saarthi.service;

import com.saarthi.dto.SymptomAnalysisResponse;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.web.client.ResourceAccessException;

import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:gemini-resilience;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Import(GeminiResilienceIntegrationTest.TestConfig.class)
@TestExecutionListeners(
        listeners = DependencyInjectionTestExecutionListener.class,
        mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS
)
class GeminiResilienceIntegrationTest {

    private static final List<String> SYMPTOMS = List.of("fatigue", "irregular periods");

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ControlledGeminiClient geminiClient;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    private CircuitBreaker circuitBreaker;

    @BeforeEach
    void reset() {
        circuitBreaker = circuitBreakerRegistry.circuitBreaker(GeminiService.CIRCUIT_BREAKER_NAME);
        circuitBreaker.reset();
        geminiClient.reset();
    }

    @Test
    void repeatedFailuresOpenCircuitAndShortCircuitLaterCalls() {
        assertTrue(AopUtils.isAopProxy(geminiService), "GeminiService must be called through a Spring AOP proxy");
        geminiClient.mode = Mode.FAIL;
        int attempted = 7;
        int fallbackResponses = 0;

        for (int call = 0; call < attempted; call++) {
            if (geminiService.analyzeSymptoms(SYMPTOMS).source() == SymptomAnalysisResponse.Source.FALLBACK) {
                fallbackResponses++;
            }
        }

        int actualInvocations = geminiClient.invocations.get();
        int shortCircuited = attempted - actualInvocations;

        assertEquals(4, circuitBreaker.getCircuitBreakerConfig().getSlidingWindowSize());
        assertEquals(4, circuitBreaker.getCircuitBreakerConfig().getMinimumNumberOfCalls());
        assertEquals(50.0f, circuitBreaker.getCircuitBreakerConfig().getFailureRateThreshold());
        assertEquals(4, actualInvocations);
        assertEquals(7, fallbackResponses);
        assertEquals(3, shortCircuited);
        assertEquals(CircuitBreaker.State.OPEN, circuitBreaker.getState());

        System.out.printf(
                "GEMINI_RESILIENCE_EXPERIMENT slidingWindowSize=%d minimumCalls=%d failureRateThreshold=%.1f failuresInjected=%d actualClientInvocations=%d fallbackResponses=%d circuitState=%s callsShortCircuited=%d%n",
                circuitBreaker.getCircuitBreakerConfig().getSlidingWindowSize(),
                circuitBreaker.getCircuitBreakerConfig().getMinimumNumberOfCalls(),
                circuitBreaker.getCircuitBreakerConfig().getFailureRateThreshold(),
                4, actualInvocations, fallbackResponses, circuitBreaker.getState(), shortCircuited);
    }

    @Test
    void halfOpenSuccessfulTrialsCloseCircuitAgain() {
        geminiClient.mode = Mode.FAIL;
        for (int call = 0; call < 4; call++) {
            geminiService.analyzeSymptoms(SYMPTOMS);
        }
        assertEquals(CircuitBreaker.State.OPEN, circuitBreaker.getState());

        geminiClient.mode = Mode.SUCCESS;
        circuitBreaker.transitionToHalfOpenState();
        CircuitBreaker.State stateBeforeTrials = circuitBreaker.getState();
        SymptomAnalysisResponse first = geminiService.analyzeSymptoms(SYMPTOMS);
        CircuitBreaker.State stateAfterFirstTrial = circuitBreaker.getState();
        SymptomAnalysisResponse second = geminiService.analyzeSymptoms(SYMPTOMS);

        assertEquals(SymptomAnalysisResponse.Source.GEMINI, first.source());
        assertEquals(SymptomAnalysisResponse.Source.GEMINI, second.source());
        assertEquals(CircuitBreaker.State.HALF_OPEN, stateBeforeTrials);
        assertEquals(CircuitBreaker.State.HALF_OPEN, stateAfterFirstTrial);
        assertEquals(CircuitBreaker.State.CLOSED, circuitBreaker.getState());

        System.out.printf(
                "GEMINI_RECOVERY_EXPERIMENT stateBeforeTrials=%s successfulTrialCalls=2 stateAfterFirstTrial=%s finalState=%s totalClientInvocations=%d%n",
                stateBeforeTrials, stateAfterFirstTrial, circuitBreaker.getState(), geminiClient.invocations.get());
    }

    @Test
    void timeoutFailureReturnsFallbackWithoutWaitingForProductionTimeout() {
        geminiClient.mode = Mode.TIMEOUT;
        long started = System.nanoTime();

        SymptomAnalysisResponse response = geminiService.analyzeSymptoms(SYMPTOMS);
        long elapsedMs = Duration.ofNanos(System.nanoTime() - started).toMillis();

        assertEquals(SymptomAnalysisResponse.Source.FALLBACK, response.source());
        assertEquals(1, geminiClient.invocations.get());
        assertTrue(elapsedMs < 2_000, "Mocked timeout fallback should be immediate in the automated test");

        System.out.printf(
                "GEMINI_TIMEOUT_EXPERIMENT clientInvocations=%d fallbackResponses=1 elapsedMs=%d productionConnectTimeoutSeconds=3 productionReadTimeoutSeconds=10%n",
                geminiClient.invocations.get(), elapsedMs);
    }

    @Test
    void malformedGeminiJsonIsRejectedAndUsesFallback() {
        geminiClient.mode = Mode.MALFORMED;

        SymptomAnalysisResponse response = geminiService.analyzeSymptoms(SYMPTOMS);

        assertEquals(SymptomAnalysisResponse.Source.FALLBACK, response.source());
        assertEquals(1, geminiClient.invocations.get());
    }

    enum Mode {
        SUCCESS,
        FAIL,
        TIMEOUT,
        MALFORMED
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        ControlledGeminiClient controlledGeminiClient() {
            return new ControlledGeminiClient();
        }
    }

    static class ControlledGeminiClient implements GeminiClient {
        private static final String VALID_RESPONSE = """
                {
                  "predicted_condition": "A possible hormonal pattern",
                  "confidence": 0.45,
                  "urgency": "Low",
                  "recommended_specialist": "Gynecologist",
                  "doctor_questions": ["What should I track?"],
                  "home_care": "Track symptoms and seek professional care if they persist."
                }
                """;

        private final AtomicInteger invocations = new AtomicInteger();
        private Mode mode = Mode.SUCCESS;

        @Override
        public String generateContent(String prompt) {
            invocations.incrementAndGet();
            return switch (mode) {
                case SUCCESS -> VALID_RESPONSE;
                case FAIL -> throw new GeminiHttpClient.GeminiClientException("controlled upstream failure");
                case TIMEOUT -> throw new ResourceAccessException(
                        "controlled timeout", new SocketTimeoutException("read timed out"));
                case MALFORMED -> "not-json";
            };
        }

        void reset() {
            invocations.set(0);
            mode = Mode.SUCCESS;
        }
    }
}
