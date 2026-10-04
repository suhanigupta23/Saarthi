package com.saarthi.controller;

import com.saarthi.dto.DoctorPlaceResponse;
import com.saarthi.service.OsmProviderService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DoctorControllerTest {

    private final StubOsmProviderService providerService = new StubOsmProviderService();
    private final DoctorController controller = new DoctorController(providerService);

    @Test
    void returnsMappedOsmProviderDtos() {
        DoctorPlaceResponse provider = new DoctorPlaceResponse(
                "node/123", "Bhopal Women's Clinic", "Bhopal, MP",
                23.2599, 77.4126, 0.4,
                "clinic", "gynaecology", "+91 12345 67890",
                "https://example.org", "https://www.openstreetmap.org/node/123"
        );
        providerService.response = List.of(provider);

        ResponseEntity<?> response = controller.getNearbyGynecologists(
                23.2599, 77.4126, 25, "gyno"
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(List.of(provider), response.getBody());
    }

    @Test
    void rejectsInvalidCoordinatesRadiusAndSpecialty() {
        assertThrows(com.saarthi.exception.InvalidApiRequestException.class,
                () -> controller.getNearbyGynecologists(91, 77, 25, "gyno"));
        assertThrows(com.saarthi.exception.InvalidApiRequestException.class,
                () -> controller.getNearbyGynecologists(23, 77, 26, "gyno"));
        assertThrows(com.saarthi.exception.InvalidApiRequestException.class,
                () -> controller.getNearbyGynecologists(23, 77, 25, "cardiologist"));
    }

    @Test
    void returnsBadGatewayWhenOverpassFails() {
        providerService.failure = new OsmProviderService.OsmProviderException("Overpass failed", null);

        assertThrows(OsmProviderService.OsmProviderException.class,
                () -> controller.getNearbyGynecologists(23, 77, 25, "gyno"));
    }

    @Test
    void defaultsMissingRadiusAndSpecialty() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/api/gynecologists")
                        .param("lat", "23.2599")
                        .param("lng", "77.4126"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        assertEquals(23.2599, providerService.latitude);
        assertEquals(77.4126, providerService.longitude);
        assertEquals(25, providerService.radiusKm);
        assertEquals("gyno", providerService.specialty);
    }

    @Test
    void rejectsMalformedRadius() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/api/gynecologists")
                        .param("lat", "23.2599")
                        .param("lng", "77.4126")
                        .param("radius_km", "not-a-number"))
                .andExpect(status().isBadRequest());
    }

    private static class StubOsmProviderService extends OsmProviderService {
        private List<DoctorPlaceResponse> response = List.of();
        private RuntimeException failure;
        private double latitude;
        private double longitude;
        private double radiusKm;
        private String specialty;

        private StubOsmProviderService() {
            super(new RestTemplateBuilder(), "https://example.test/overpass");
        }

        @Override
        public List<DoctorPlaceResponse> searchNearbyProviders(
                double latitude,
                double longitude,
                double radiusKm,
                String specialty) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.radiusKm = radiusKm;
            this.specialty = specialty;
            if (failure != null) {
                throw failure;
            }
            return response;
        }
    }
}
