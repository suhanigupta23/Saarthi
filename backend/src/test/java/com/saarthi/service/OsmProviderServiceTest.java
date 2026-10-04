package com.saarthi.service;

import com.saarthi.dto.DoctorPlaceResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OsmProviderServiceTest {

    @Test
    void sendsCoordinatesWithIdentifyingUserAgentAndMapsOsmElements() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        String endpoint = "https://example.test/overpass";
        OsmProviderService service = new OsmProviderService(restTemplate, endpoint, 0);

        server.expect(once(), requestTo(endpoint))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("User-Agent", OsmProviderService.USER_AGENT))
                .andExpect(request -> {
                    String body = ((MockClientHttpRequest) request).getBodyAsString();
                    String encodedQuery = body.startsWith("data=") ? body.substring(5) : "";
                    String query = URLDecoder.decode(encodedQuery, StandardCharsets.UTF_8);
                    assertTrue(query.contains("(around:25000,23.2599,77.4126)"));
                    assertTrue(query.contains("gynecology|gynaecology|obstetrics"));
                    assertTrue(query.contains("out center tags"));
                })
                .andRespond(withSuccess("""
                        {
                          "elements": [
                            {
                              "type": "node",
                              "id": 123,
                              "lat": 23.2599,
                              "lon": 77.4126,
                              "tags": {
                                "name": "Bhopal Women's Clinic",
                                "healthcare": "clinic",
                                "healthcare:speciality": "gynaecology",
                                "addr:street": "Example Road",
                                "addr:city": "Bhopal",
                                "contact:phone": "+91 12345 67890",
                                "website": "https://example.org"
                              }
                            },
                            {
                              "type": "way",
                              "id": 456,
                              "center": {"lat": 23.2699, "lon": 77.4226},
                              "tags": {
                                "name": "Maternity Hospital",
                                "amenity": "hospital",
                                "addr:full": "Full Address, Bhopal"
                              }
                            },
                            {
                              "type": "node",
                              "id": 999,
                              "lat": 28.6139,
                              "lon": 77.2090,
                              "tags": {"name": "Too Far Clinic", "healthcare": "clinic"}
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service.searchNearbyProviders(
                23.2599, 77.4126, 25, "gyno"
        );

        server.verify();
        assertEquals(2, results.size());
        DoctorPlaceResponse first = results.get(0);
        assertEquals("node/123", first.providerId());
        assertEquals("Bhopal Women's Clinic", first.name());
        assertEquals("Example Road, Bhopal", first.address());
        assertEquals("clinic", first.providerType());
        assertEquals("gynaecology", first.specialty());
        assertEquals("+91 12345 67890", first.phone());
        assertEquals("https://example.org", first.website());
        assertEquals("https://www.openstreetmap.org/node/123", first.osmUrl());
        assertEquals(0.0, first.distanceKm());
        assertEquals("way/456", results.get(1).providerId());
    }

    @ParameterizedTest
    @CsvSource({
            "gyno,gynecology|gynaecology|obstetrics",
            "maternity,healthcare\"=\"midwife",
            "psychologist,psychotherapist|psychologist"
    })
    void mapsSpecialtyOptionsToOsmTagQueries(String specialty, String expectedQueryPart) {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        String endpoint = "https://example.test/overpass";
        OsmProviderService service = new OsmProviderService(restTemplate, endpoint, 0);

        server.expect(requestTo(endpoint))
                .andExpect(request -> {
                    String body = ((MockClientHttpRequest) request).getBodyAsString();
                    String query = URLDecoder.decode(body.substring(5), StandardCharsets.UTF_8);
                    assertTrue(query.contains(expectedQueryPart));
                })
                .andRespond(withSuccess("{\"elements\":[]}", MediaType.APPLICATION_JSON));

        assertTrue(service.searchNearbyProviders(23.2599, 77.4126, 10, specialty).isEmpty());
        server.verify();
    }

    @Test
    void convertsOverpassHttpFailureIntoDomainException() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        String endpoint = "https://example.test/overpass";
        OsmProviderService service = new OsmProviderService(restTemplate, endpoint, 0);

        server.expect(requestTo(endpoint)).andRespond(withServerError());

        assertThrows(
                OsmProviderService.OsmProviderException.class,
                () -> service.searchNearbyProviders(23.2599, 77.4126, 10, "gyno")
        );
        server.verify();
    }

    @Test
    void calculatesReasonableDistanceForKnownCoordinates() {
        double distance = OsmProviderService.calculateDistance(
                28.6139, 77.2090, 19.0760, 72.8777
        );

        assertTrue(distance > 1_130 && distance < 1_170);
    }
}
