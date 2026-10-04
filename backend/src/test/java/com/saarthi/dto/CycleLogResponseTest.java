package com.saarthi.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.CycleLog;
import com.saarthi.model.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CycleLogResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void serializationIncludesCycleFieldsButNotAssociatedUser() {
        User user = new User("patient", "$2a$10$examplePasswordHash", "Patient Name");
        user.setLocation("Bhopal, MP");
        CycleLog log = new CycleLog(user, LocalDate.of(2026, 10, 2), "Good", "Medium", "Cramps");
        log.setId(7L);

        JsonNode json = objectMapper.valueToTree(CycleLogResponse.from(log));

        assertEquals(5, json.size());
        assertEquals(7L, json.get("id").asLong());
        assertTrue(json.has("startDate"));
        assertEquals("Good", json.get("mood").asText());
        assertEquals("Medium", json.get("flow").asText());
        assertEquals("Cramps", json.get("symptoms").asText());
        assertFalse(json.has("user"));
        assertFalse(json.has("password"));
        assertFalse(json.has("username"));
        assertFalse(json.has("location"));
        assertFalse(json.toString().contains("$2a$10$examplePasswordHash"));
    }
}
