package com.saarthi.service;

import com.saarthi.dto.DoctorPlaceResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withTooManyRequests;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;

class GeoapifyProviderServiceTest {

    private static final String ENDPOINT = "https://example.test/v2/places";
    private static final String API_KEY = "obviously-synthetic-key";

    @Test
    void mapsExactGynaecologyResultsAndSendsKeyOnlyInHeader() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(once(), requestTo(ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-api-key", API_KEY))
                .andExpect(header("User-Agent", GeoapifyProviderService.USER_AGENT))
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.categories.length()").value(1))
                .andExpect(jsonPath("$.categories[0]").value("healthcare.clinic_or_praxis.gynaecology"))
                .andExpect(jsonPath("$.filter.radius").value(25000))
                .andRespond(withSuccess(featureCollection(
                        feature("near", "Near Women's Clinic", 77.4127, 23.2600,
                                "healthcare.clinic_or_praxis.gynaecology"),
                        feature("far", "Far Women's Clinic", 77.4220, 23.2700,
                                "healthcare.clinic_or_praxis.gynaecology"),
                        feature("generic", "Generic Hospital", 77.4130, 23.2602,
                                "healthcare.hospital")
                ), MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service(template, API_KEY)
                .searchNearbyProviders(23.2599, 77.4126, 25, "gyno");

        assertEquals(2, results.size());
        assertEquals("Near Women's Clinic", results.get(0).name());
        assertTrue(results.get(0).providerId().startsWith("geoapify:"));
        assertFalse(results.get(0).outsideRequestedRadius());
        server.verify();
    }

    @Test
    void expandsFromRequestedRadiusToBoundedSameCoordinateFallback() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(once(), requestTo(ENDPOINT))
                .andExpect(jsonPath("$.filter.lat").value(23.2599))
                .andExpect(jsonPath("$.filter.lon").value(77.4126))
                .andExpect(jsonPath("$.filter.radius").value(25000))
                .andRespond(withSuccess("{\"type\":\"FeatureCollection\",\"features\":[]}", MediaType.APPLICATION_JSON));
        server.expect(once(), requestTo(ENDPOINT))
                .andExpect(jsonPath("$.filter.lat").value(23.2599))
                .andExpect(jsonPath("$.filter.lon").value(77.4126))
                .andExpect(jsonPath("$.filter.radius").value(50000))
                .andRespond(withSuccess(featureCollection(
                        feature("outside", "Regional Women's Clinic", 77.7126, 23.2599,
                                "healthcare.clinic_or_praxis.gynaecology")), MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service(template, API_KEY)
                .searchNearbyProviders(23.2599, 77.4126, 25, "gyno");

        assertEquals(1, results.size());
        assertTrue(results.get(0).distanceKm() > 25);
        assertTrue(results.get(0).outsideRequestedRadius());
        server.verify();
    }

    @Test
    void smallerRadiusUsesRequestedThenTwentyFiveThenFiftyKilometres() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        for (int radius : List.of(10_000, 25_000, 50_000)) {
            server.expect(once(), requestTo(ENDPOINT))
                    .andExpect(jsonPath("$.filter.lat").value(28.6139))
                    .andExpect(jsonPath("$.filter.lon").value(77.2090))
                    .andExpect(jsonPath("$.filter.radius").value(radius))
                    .andRespond(withSuccess("{\"type\":\"FeatureCollection\",\"features\":[]}", MediaType.APPLICATION_JSON));
        }

        assertTrue(service(template, API_KEY)
                .searchNearbyProviders(28.6139, 77.2090, 10, "gyno").isEmpty());
        server.verify();
    }

    @Test
    void maternityRequiresSupportingNameAndHealthcareMetadata() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(requestTo(ENDPOINT))
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.categories[0]").value("healthcare"))
                .andExpect(jsonPath("$.name").value("maternity"))
                .andRespond(withSuccess(featureCollection(
                        feature("maternity", "City Maternity Hospital", 77.4127, 23.2600, "healthcare.hospital"),
                        feature("generic", "City General Hospital", 77.4128, 23.2601, "healthcare.hospital")
                ), MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service(template, API_KEY)
                .searchNearbyProviders(23.2599, 77.4126, 25, "maternity");

        assertEquals(1, results.size());
        assertEquals("City Maternity Hospital", results.get(0).name());
        assertEquals("Maternity-related healthcare", results.get(0).specialty());
        server.verify();
    }

    @Test
    void psychiatryIsNotPresentedAsPsychology() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(requestTo(ENDPOINT))
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.categories[0]").value("healthcare.clinic_or_praxis.psychiatry"))
                .andRespond(withSuccess(featureCollection(
                        feature("psychiatry", "Mental Health Centre", 77.4127, 23.2600,
                                "healthcare.clinic_or_praxis.psychiatry")), MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service(template, API_KEY)
                .searchNearbyProviders(23.2599, 77.4126, 25, "psychologist");

        assertEquals("Psychiatry / mental health", results.get(0).specialty());
        assertFalse(results.get(0).specialty().toLowerCase().contains("psychologist"));
        server.verify();
    }

    @Test
    void deduplicatesByPlaceIdAndSortsByCalculatedDistance() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(featureCollection(
                feature("same", "Far", 77.4220, 23.2700, "healthcare.clinic_or_praxis.gynaecology"),
                feature("same", "Duplicate", 77.4127, 23.2600, "healthcare.clinic_or_praxis.gynaecology"),
                feature("near", "Near", 77.4128, 23.2601, "healthcare.clinic_or_praxis.gynaecology")
        ), MediaType.APPLICATION_JSON));

        List<DoctorPlaceResponse> results = service(template, API_KEY)
                .searchNearbyProviders(23.2599, 77.4126, 25, "gyno");

        assertEquals(2, results.size());
        assertEquals("Near", results.get(0).name());
        server.verify();
    }

    @Test
    void missingApiKeyFailsBeforeNetworkCall() {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();

        assertThrows(GeoapifyProviderService.GeoapifyProviderException.class,
                () -> service(template, " ").searchNearbyProviders(23, 77, 25, "gyno"));
        server.verify();
    }

    @Test
    void handlesRateLimitServerFailureTimeoutAndMalformedResponse() {
        assertUpstreamFailure(withTooManyRequests());
        assertUpstreamFailure(withServerError());
        assertUpstreamFailure(withException(new SocketTimeoutException("synthetic timeout")));
        assertEquals("CONNECT_OR_READ_TIMEOUT", GeoapifyProviderService.classifyFailure(
                new ResourceAccessException("synthetic transport wrapper",
                        new SocketTimeoutException("synthetic timeout"))).reason());

        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(requestTo(ENDPOINT))
                .andRespond(withSuccess("{\"unexpected\":true}", MediaType.APPLICATION_JSON));
        assertThrows(GeoapifyProviderService.GeoapifyProviderException.class,
                () -> service(template, API_KEY).searchNearbyProviders(23, 77, 25, "gyno"));
        server.verify();
    }

    private static void assertUpstreamFailure(org.springframework.test.web.client.ResponseCreator response) {
        RestTemplate template = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
        server.expect(requestTo(ENDPOINT)).andRespond(response);
        assertThrows(GeoapifyProviderService.GeoapifyProviderException.class,
                () -> service(template, API_KEY).searchNearbyProviders(23, 77, 25, "gyno"));
        server.verify();
    }

    private static GeoapifyProviderService service(RestTemplate template, String apiKey) {
        return new GeoapifyProviderService(template, ENDPOINT, apiKey, 0);
    }

    private static String featureCollection(String... features) {
        return "{\"type\":\"FeatureCollection\",\"features\":[" + String.join(",", features) + "]}";
    }

    private static String feature(String id, String name, double longitude, double latitude, String category) {
        return """
                {"type":"Feature","properties":{"place_id":"%s","name":"%s","formatted":"Test address","categories":["%s"]},"geometry":{"type":"Point","coordinates":[%s,%s]}}
                """.formatted(id, name, category, longitude, latitude).trim();
    }
}
