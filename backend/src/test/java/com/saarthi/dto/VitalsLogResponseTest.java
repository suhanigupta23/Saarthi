package com.saarthi.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.User;
import com.saarthi.model.VitalsLog;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class VitalsLogResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serializationIncludesTrendFieldsButNotAssociatedUserOrUnusedHealthFields() {
        User user = new User("patient", "$2a$10$examplePasswordHash", "Patient Name");
        user.setPregnancyStatus("pregnant");
        VitalsLog log = new VitalsLog(
                user,
                LocalDateTime.now(),
                120,
                80,
                95,
                60.5,
                165.0,
                22.2,
                "Regular Check",
                "Oct"
        );

        JsonNode json = objectMapper.valueToTree(VitalsLogResponse.from(log));

        assertEquals(5, json.size());
        assertEquals("Oct", json.get("monthLabel").asText());
        assertEquals(120, json.get("systolic").asInt());
        assertEquals(80, json.get("diastolic").asInt());
        assertEquals(95, json.get("bloodSugar").asInt());
        assertEquals(60.5, json.get("weight").asDouble());
        assertFalse(json.has("user"));
        assertFalse(json.has("password"));
        assertFalse(json.has("username"));
        assertFalse(json.has("pregnancyStatus"));
        assertFalse(json.has("height"));
        assertFalse(json.has("bmi"));
        assertFalse(json.has("category"));
        assertFalse(json.has("recordedAt"));
        assertFalse(json.toString().contains("$2a$10$examplePasswordHash"));
    }
}
