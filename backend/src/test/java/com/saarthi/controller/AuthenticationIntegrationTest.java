package com.saarthi.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.User;
import com.saarthi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.test.context.web.ServletTestExecutionListener;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authentication;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@TestExecutionListeners(
        listeners = {ServletTestExecutionListener.class, DependencyInjectionTestExecutionListener.class},
        mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS
)
class AuthenticationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void clearUsers() {
        userRepository.deleteAll();
    }

    @Test
    void normalSignupSigninAndJwtAuthenticatedProfileWork() throws Exception {
        String username = "auth-test@example.com";
        String plaintextPassword = "correct-password";

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"auth-test@example.com",
                                  "password":"correct-password",
                                  "name":"Auth Test",
                                  "age":"25",
                                  "location":"Pune",
                                  "pregnancyStatus":"not_pregnant"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));

        User stored = userRepository.findByUsername(username).orElseThrow();
        assertNotEquals(plaintextPassword, stored.getPassword());
        assertTrue(stored.getPassword().startsWith("$2"), "Password should be stored as a BCrypt hash");

        String signinBody = mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"auth-test@example.com\",\"password\":\"correct-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        JsonNode signin = objectMapper.readTree(signinBody);
        String token = signin.path("token").asText();
        assertEqualsThreeJwtSegments(token);
        assertFalse(token.contains("mock"));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.name").value("Auth Test"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void incorrectPasswordDoesNotIssueJwt() throws Exception {
        registerBasicUser("wrong-password@example.com");

        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"wrong-password@example.com\",\"password\":\"incorrect\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void protectedApiRejectsMissingAndFormerFakeTokens() throws Exception {
        mockMvc.perform(get("/api/appointments/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/symptoscan/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symptoms\":[\"fatigue\"]}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/appointments/my")
                        .header("Authorization", "Bearer google_mock_jwt_token"))
                .andExpect(status().isUnauthorized());
    }

    private void registerBasicUser(String username) throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"%s",
                                  "password":"correct-password",
                                  "name":"Auth Test"
                                }
                                """.formatted(username)))
                .andExpect(status().isOk());
    }

    private void assertEqualsThreeJwtSegments(String token) {
        assertTrue(token.split("\\.").length == 3, "A signed JWT should contain three dot-separated segments");
    }
}
