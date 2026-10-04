package com.saarthi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class GeminiHttpClient implements GeminiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String endpoint;

    @Autowired
    public GeminiHttpClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl,
            @Value("${gemini.model:gemini-3.5-flash}") String model,
            @Value("${gemini.connect-timeout:3s}") Duration connectTimeout,
            @Value("${gemini.read-timeout:10s}") Duration readTimeout) {
        this(restTemplateBuilder
                        .setConnectTimeout(connectTimeout)
                        .setReadTimeout(readTimeout)
                        .build(),
                apiKey,
                baseUrl.replaceAll("/+$", "") + "/" + model + ":generateContent");
    }

    GeminiHttpClient(RestTemplate restTemplate, String apiKey, String endpoint) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    @Override
    @SuppressWarnings("rawtypes")
    public String generateContent(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new GeminiClientException("Gemini API key is not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    endpoint,
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );
            return extractText(response.getBody());
        } catch (RestClientException exception) {
            throw new GeminiClientException("Gemini request failed", exception);
        }
    }

    private String extractText(Map<?, ?> response) {
        if (response == null || !(response.get("candidates") instanceof List<?> candidates)
                || candidates.isEmpty() || !(candidates.get(0) instanceof Map<?, ?> candidate)
                || !(candidate.get("content") instanceof Map<?, ?> content)
                || !(content.get("parts") instanceof List<?> parts)
                || parts.isEmpty() || !(parts.get(0) instanceof Map<?, ?> part)
                || !(part.get("text") instanceof String text) || text.isBlank()) {
            throw new GeminiClientException("Gemini returned an unexpected response");
        }
        return text;
    }

    public static class GeminiClientException extends RuntimeException {
        public GeminiClientException(String message) {
            super(message);
        }

        public GeminiClientException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
