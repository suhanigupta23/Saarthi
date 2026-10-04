package com.saarthi.service;

import com.saarthi.dto.DoctorPlaceResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OsmProviderService {

    static final String USER_AGENT = "Saarthi-Student-Portfolio/1.0 (https://github.com/suhanigupta23/Saarthi)";

    private final RestTemplate restTemplate;
    private final String endpoint;
    private final long minimumRequestIntervalMs;
    private final Object rateLimitLock = new Object();
    private long lastRequestStartedAt;

    @Autowired
    public OsmProviderService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${osm.overpass.url:https://overpass-api.de/api/interpreter}") String endpoint) {
        this(
                restTemplateBuilder
                        .setConnectTimeout(Duration.ofSeconds(5))
                        .setReadTimeout(Duration.ofSeconds(20))
                        .build(),
                endpoint,
                1_000
        );
    }

    OsmProviderService(RestTemplate restTemplate, String endpoint, long minimumRequestIntervalMs) {
        this.restTemplate = restTemplate;
        this.endpoint = endpoint;
        this.minimumRequestIntervalMs = minimumRequestIntervalMs;
    }

    public List<DoctorPlaceResponse> searchNearbyProviders(
            double userLat,
            double userLng,
            double radiusKm,
            String specialty) {

        String query = buildQuery(userLat, userLng, radiusKm, specialty);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set(HttpHeaders.USER_AGENT, USER_AGENT);

        String body = "data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);

        try {
            ResponseEntity<Map> response = executeRateLimitedRequest(body, headers);
            return mapResponse(response.getBody(), userLat, userLng, radiusKm);
        } catch (RestClientException | ClassCastException exception) {
            throw new OsmProviderException("Overpass request failed", exception);
        }
    }

    private String buildQuery(double latitude, double longitude, double radiusKm, String specialty) {
        long radiusMetres = Math.round(radiusKm * 1_000);
        String around = "(around:" + radiusMetres + "," + latitude + "," + longitude + ")";
        List<String> selectors = switch (specialty) {
            case "maternity" -> List.of(
                    "nwr" + around + "[\"healthcare\"=\"midwife\"]",
                    "nwr" + around + "[\"healthcare:speciality\"~\"obstetrics|gynecology|gynaecology\",i]",
                    "nwr" + around + "[\"name\"~\"maternity|obstetric|women|mother\",i][\"amenity\"~\"hospital|clinic|doctors\"]"
            );
            case "psychologist" -> List.of(
                    "nwr" + around + "[\"healthcare\"~\"psychotherapist|psychologist\",i]",
                    "nwr" + around + "[\"healthcare:speciality\"~\"psychotherapy|psychiatry|psychology\",i]",
                    "nwr" + around + "[\"name\"~\"perinatal|postpartum|maternal.*psych|psycholog\",i][\"healthcare\"]"
            );
            default -> List.of(
                    "nwr" + around + "[\"healthcare:speciality\"~\"gynecology|gynaecology|obstetrics\",i]",
                    "nwr" + around + "[\"name\"~\"gynec|gynaec|obstetric|women.*clinic|maternity\",i][\"amenity\"~\"hospital|clinic|doctors\"]"
            );
        };

        return "[out:json][timeout:15];(" + selectors.stream()
                .map(selector -> selector + ";")
                .collect(Collectors.joining()) + ");out center tags;";
    }

    private List<DoctorPlaceResponse> mapResponse(
            Map<String, Object> response,
            double userLat,
            double userLng,
            double radiusKm) {

        if (response == null || response.get("elements") == null) {
            return List.of();
        }
        if (!(response.get("elements") instanceof List<?> elements)) {
            throw new OsmProviderException("Overpass returned an unexpected response", null);
        }

        List<DoctorPlaceResponse> providers = new ArrayList<>();
        Set<String> seenIds = new LinkedHashSet<>();
        for (Object rawElement : elements) {
            if (!(rawElement instanceof Map<?, ?> element)) {
                continue;
            }

            String osmType = stringValue(element.get("type"));
            Long osmId = longValue(element.get("id"));
            Map<String, Object> tags = mapValue(element.get("tags"));
            String name = stringValue(tags.get("name"));
            Double latitude = coordinate(element, "lat");
            Double longitude = coordinate(element, "lon");

            if (osmType == null || osmId == null || name == null || latitude == null || longitude == null) {
                continue;
            }

            String providerId = osmType + "/" + osmId;
            if (!seenIds.add(providerId)) {
                continue;
            }

            double distanceKm = calculateDistance(userLat, userLng, latitude, longitude);
            if (distanceKm > radiusKm) {
                continue;
            }

            providers.add(new DoctorPlaceResponse(
                    providerId,
                    name,
                    buildAddress(tags),
                    latitude,
                    longitude,
                    Math.round(distanceKm * 10.0) / 10.0,
                    firstNonBlank(stringValue(tags.get("healthcare")), stringValue(tags.get("amenity"))),
                    stringValue(tags.get("healthcare:speciality")),
                    firstNonBlank(stringValue(tags.get("contact:phone")), stringValue(tags.get("phone"))),
                    firstNonBlank(stringValue(tags.get("contact:website")), stringValue(tags.get("website"))),
                    "https://www.openstreetmap.org/" + providerId
            ));
        }

        providers.sort(Comparator.comparingDouble(DoctorPlaceResponse::distanceKm));
        return providers;
    }

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> executeRateLimitedRequest(String body, HttpHeaders headers) {
        synchronized (rateLimitLock) {
            long waitMs = minimumRequestIntervalMs - (System.currentTimeMillis() - lastRequestStartedAt);
            if (waitMs > 0) {
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new OsmProviderException("Interrupted while waiting to query Overpass", exception);
                }
            }
            lastRequestStartedAt = System.currentTimeMillis();
            return restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        }
    }

    static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double cosine = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2))
                + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
        cosine = Math.max(-1.0, Math.min(1.0, cosine));
        double distance = Math.acos(cosine);
        distance = rad2deg(distance);
        return distance * 60 * 1.1515 * 1.609344;
    }

    private static Double coordinate(Map<?, ?> element, String key) {
        Double directValue = numberValue(element.get(key));
        return directValue != null ? directValue : numberValue(mapValue(element.get("center")).get(key));
    }

    private static String buildAddress(Map<String, Object> tags) {
        String fullAddress = stringValue(tags.get("addr:full"));
        if (fullAddress != null) {
            return fullAddress;
        }
        return List.of("addr:housenumber", "addr:street", "addr:city", "addr:state", "addr:postcode")
                .stream()
                .map(tags::get)
                .map(OsmProviderService::stringValue)
                .filter(value -> value != null)
                .collect(Collectors.collectingAndThen(Collectors.joining(", "), value -> value.isBlank() ? null : value));
    }

    private static String firstNonBlank(String first, String second) {
        return first != null ? first : second;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }

    private static String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private static Double numberValue(Object value) {
        return value instanceof Number number ? number.doubleValue() : null;
    }

    private static Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }

    private static double deg2rad(double degrees) {
        return degrees * Math.PI / 180.0;
    }

    private static double rad2deg(double radians) {
        return radians * 180.0 / Math.PI;
    }

    public static class OsmProviderException extends RuntimeException {
        public OsmProviderException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
