package com.saarthi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    // Use RestTemplate which is fully supported in Spring Boot 3.1.x
    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    @CircuitBreaker(name = "geminiCircuit", fallbackMethod = "fallbackSymptomAnalysis")
    public String analyzeSymptoms(List<String> symptoms) {
        String prompt = "You are a professional medical AI for women's health. " +
                        "Analyze these symptoms: " + String.join(", ", symptoms) + ". " +
                        "What could be the cause? " +
                        "Return your response ONLY as a JSON object with these exact keys: " +
                        "'predicted_condition' (String), " +
                        "'confidence' (Double between 0.0 and 1.0), " +
                        "'urgency' (String: Low, Medium, or High), " +
                        "'recommended_specialist' (String), " +
                        "'doctor_questions' (List of Strings, max 3 items), " +
                        "'home_care' (String). " +
                        "Do not include markdown tags (like ```json), backticks, or any other explanations. Just return raw JSON.";

        // Free tier endpoint for Google AI Studio Gemini 3.5 Flash
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

        // Construct standard Gemini JSON payload structure
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Wrap payload in HttpEntity
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response == null) {
                throw new RuntimeException("Empty response body from Gemini API");
            }

            // Traverse the Gemini response payload structure:
            // response -> candidates[0] -> content -> parts[0] -> text
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String rawJsonResult = (String) parts.get(0).get("text");
            rawJsonResult = rawJsonResult.trim();
            
            // Clean up any markdown code block formatting returned by Gemini
            if (rawJsonResult.startsWith("```")) {
                if (rawJsonResult.startsWith("```json")) {
                    rawJsonResult = rawJsonResult.substring(7);
                } else {
                    rawJsonResult = rawJsonResult.substring(3);
                }
                if (rawJsonResult.endsWith("```")) {
                    rawJsonResult = rawJsonResult.substring(0, rawJsonResult.length() - 3);
                }
                rawJsonResult = rawJsonResult.trim();
            }

            return rawJsonResult;
        } catch (Exception e) {
            System.err.println(">>> GeminiService Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Gemini API Error", e);
        }
    }

    public String fallbackSymptomAnalysis(List<String> symptoms, Throwable t) {
        System.err.println("Circuit Breaker Active - Fallback triggered due to: " + t.getMessage());
        return "{\"predicted_condition\": \"AI Connection Issue (Resilience4j Fallback active)\", \"confidence\": 0.0, \"urgency\": \"Low\", \"recommended_specialist\": \"General Practitioner\", \"doctor_questions\": [\"Is there a standard clinical test for my symptoms?\"], \"home_care\": \"Stay hydrated, monitor symptom progression, and seek virtual consult if discomfort persists.\"}";
    }
}
