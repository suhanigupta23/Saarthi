package com.saarthi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.dto.SymptomAnalysisResponse;
import com.saarthi.exception.GlobalExceptionHandler;
import com.saarthi.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SymptomControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        StubGeminiService geminiService = new StubGeminiService();
        mockMvc = MockMvcBuilders.standaloneSetup(new SymptomController(geminiService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returnsTypedSourceAndMedicalDisclaimer() throws Exception {
        mockMvc.perform(post("/api/symptoscan/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symptoms\":[\"fatigue\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("GEMINI"))
                .andExpect(jsonPath("$.predicted_condition").value("Possible pattern"))
                .andExpect(jsonPath("$.disclaimer").value(
                        "Educational guidance only; this is not a diagnosis or a substitute for professional medical care."));
    }

    @Test
    void emptySymptomsReturnStandardValidationError() throws Exception {
        mockMvc.perform(post("/api/symptoscan/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symptoms\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.symptoms").value("Select at least one symptom"));
    }

    private static class StubGeminiService extends GeminiService {
        private StubGeminiService() {
            super(prompt -> "", new ObjectMapper());
        }

        @Override
        public SymptomAnalysisResponse analyzeSymptoms(List<String> symptoms) {
            return new SymptomAnalysisResponse(
                    "Possible pattern", 0.4, "Low", "Gynecologist",
                    List.of("What should I track?"), "Track symptoms.",
                    SymptomAnalysisResponse.Source.GEMINI,
                    "Educational guidance only; this is not a diagnosis or a substitute for professional medical care."
            );
        }
    }
}
