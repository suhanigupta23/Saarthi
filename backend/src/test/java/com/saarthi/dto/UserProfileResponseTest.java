package com.saarthi.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class UserProfileResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serializationIncludesProfileFieldsButNotPasswordOrInternalId() {
        User user = new User("patient@example.com", "$2a$10$examplePasswordHash", "Patient Name");
        user.setId(42L);
        user.setAge("26");
        user.setLocation("Bhopal, MP");
        user.setPregnancyStatus("not_pregnant");

        JsonNode json = objectMapper.valueToTree(UserProfileResponse.from(user));

        assertEquals(5, json.size());
        assertEquals("patient@example.com", json.get("username").asText());
        assertEquals("Patient Name", json.get("name").asText());
        assertEquals("26", json.get("age").asText());
        assertEquals("Bhopal, MP", json.get("location").asText());
        assertEquals("not_pregnant", json.get("pregnancyStatus").asText());
        assertFalse(json.has("id"));
        assertFalse(json.has("password"));
        assertFalse(json.toString().contains("$2a$10$examplePasswordHash"));
    }
}
