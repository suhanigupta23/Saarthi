package com.saarthi.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiHttpClientTest {

    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

    @Test
    void sendsApiKeyInHeaderAndExtractsCandidateText() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        GeminiHttpClient client = new GeminiHttpClient(restTemplate, "secret-test-key", ENDPOINT);
        server.expect(requestTo(ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "secret-test-key"))
                .andRespond(withSuccess("""
                        {"candidates":[{"content":{"parts":[{"text":"{\\"urgency\\":\\"Low\\"}"}]}}]}
                        """, MediaType.APPLICATION_JSON));

        String result = client.generateContent("educational prompt");

        assertEquals("{\"urgency\":\"Low\"}", result);
        server.verify();
    }

    @Test
    void rejectsUnexpectedGeminiResponseShape() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        GeminiHttpClient client = new GeminiHttpClient(restTemplate, "secret-test-key", ENDPOINT);
        server.expect(requestTo(ENDPOINT))
                .andRespond(withSuccess("{\"candidates\":[]}", MediaType.APPLICATION_JSON));

        assertThrows(GeminiHttpClient.GeminiClientException.class,
                () -> client.generateContent("educational prompt"));
        server.verify();
    }
}
