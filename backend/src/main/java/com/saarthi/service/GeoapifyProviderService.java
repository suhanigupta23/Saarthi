package com.saarthi.service;

import com.saarthi.dto.DoctorPlaceResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class GeoapifyProviderService {

    private static final Logger LOGGER = LoggerFactory.getLogger(GeoapifyProviderService.class);
    static final String USER_AGENT = "Saarthi-Student-Portfolio/1.0 (https://github.com/suhanigupta23/Saarthi)";
    static final double MAX_FALLBACK_RADIUS_KM = 50.0;
    private static final int RESULT_LIMIT = 20;
    private static final Pattern MATERNITY_NAME = Pattern.compile(
            "(?i).*(maternity|maternal|obstetric|mother\\s*(?:&|and|-)?\\s*child|women'?s\\s+(?:hospital|clinic)).*");

    private final RestTemplate restTemplate;
    private final String endpoint;
    private final String apiKey;
    private final long minimumRequestIntervalMs;
    private final Object rateLimitLock = new Object();
    private long lastRequestStartedAt;

    @Autowired
    public GeoapifyProviderService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${geoapify.places-url:https://api.geoapify.com/v2/places}") String endpoint,
            @Value("${geoapify.api-key:}") String apiKey) {
        this(restTemplateBuilder
                        .setConnectTimeout(Duration.ofSeconds(5))
                        .setReadTimeout(Duration.ofSeconds(20))
                        .build(),
                endpoint,
                apiKey,
                250);
    }

    GeoapifyProviderService(
            RestTemplate restTemplate,
            String endpoint,
            String apiKey,
            long minimumRequestIntervalMs) {
        this.restTemplate = restTemplate;
        this.endpoint = endpoint;
        this.apiKey = apiKey;
        this.minimumRequestIntervalMs = minimumRequestIntervalMs;
    }

    public List<DoctorPlaceResponse> searchNearbyProviders(
            double userLat,
            double userLng,
            double requestedRadiusKm,
            String specialty) {
        try {
            if (apiKey == null || apiKey.isBlank()) {
                throw new GeoapifyProviderException("Geoapify API key is not configured", null);
            }

            for (double radiusKm : searchRadii(requestedRadiusKm)) {
                List<DoctorPlaceResponse> providers = executeSearch(
                        userLat, userLng, radiusKm, requestedRadiusKm, specialty);
                if (!providers.isEmpty()) {
                    return providers;
                }
            }
            return List.of();
        } catch (RuntimeException exception) {
            FailureDiagnostic diagnostic = classifyFailure(exception);
            LOGGER.warn("GEOAPIFY_PROVIDER_FAILURE reason={} httpStatus={} exception={}",
                    diagnostic.reason(), diagnostic.httpStatus(), diagnostic.exceptionName());
            if (exception instanceof GeoapifyProviderException providerException) {
                throw providerException;
            }
            throw new GeoapifyProviderException("Geoapify provider request failed", exception);
        }
    }

    private List<Double> searchRadii(double requestedRadiusKm) {
        LinkedHashSet<Double> radii = new LinkedHashSet<>();
        radii.add(requestedRadiusKm);
        if (requestedRadiusKm < 25.0) {
            radii.add(25.0);
        }
        if (requestedRadiusKm < MAX_FALLBACK_RADIUS_KM) {
            radii.add(MAX_FALLBACK_RADIUS_KM);
        }
        return List.copyOf(radii);
    }

    @SuppressWarnings("rawtypes")
    private List<DoctorPlaceResponse> executeSearch(
            double userLat,
            double userLng,
            double radiusKm,
            double requestedRadiusKm,
            String specialty) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set(HttpHeaders.USER_AGENT, USER_AGENT);
        headers.set("x-api-key", apiKey);

        Map<String, Object> body = buildRequest(userLat, userLng, radiusKm, specialty);
        ResponseEntity<Map> response = executeRateLimitedRequest(body, headers);
        return mapResponse(response.getBody(), userLat, userLng, radiusKm, requestedRadiusKm, specialty);
    }

    private Map<String, Object> buildRequest(
            double latitude,
            double longitude,
            double radiusKm,
            String specialty) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("categories", List.of(categoryFor(specialty)));
        request.put("filter", Map.of(
                "type", "circle",
                "lon", longitude,
                "lat", latitude,
                "radius", Math.round(radiusKm * 1_000)));
        request.put("bias", Map.of("type", "proximity", "lon", longitude, "lat", latitude));
        request.put("limit", RESULT_LIMIT);
        request.put("lang", "en");
        if ("maternity".equals(specialty)) {
            request.put("name", "maternity");
        }
        return request;
    }

    private static String categoryFor(String specialty) {
        return switch (specialty) {
            case "maternity" -> "healthcare";
            case "psychologist" -> "healthcare.clinic_or_praxis.psychiatry";
            default -> "healthcare.clinic_or_praxis.gynaecology";
        };
    }

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> executeRateLimitedRequest(Map<String, Object> body, HttpHeaders headers) {
        synchronized (rateLimitLock) {
            long waitMs = minimumRequestIntervalMs - (System.currentTimeMillis() - lastRequestStartedAt);
            if (waitMs > 0) {
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new GeoapifyProviderException("Interrupted before Geoapify request", exception);
                }
            }
            lastRequestStartedAt = System.currentTimeMillis();
            return restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class);
        }
    }

    private List<DoctorPlaceResponse> mapResponse(
            Map<String, Object> response,
            double userLat,
            double userLng,
            double searchRadiusKm,
            double requestedRadiusKm,
            String requestedSpecialty) {
        if (response == null || !(response.get("features") instanceof List<?> features)) {
            throw new GeoapifyProviderException("Geoapify returned an unexpected response", null);
        }

        Map<String, DoctorPlaceResponse> unique = new LinkedHashMap<>();
        for (Object rawFeature : features) {
            if (!(rawFeature instanceof Map<?, ?> feature)) {
                continue;
            }
            Map<String, Object> properties = mapValue(feature.get("properties"));
            Map<String, Object> geometry = mapValue(feature.get("geometry"));
            List<?> coordinates = geometry.get("coordinates") instanceof List<?> values ? values : List.of();

            String rawPlaceId = stringValue(properties.get("place_id"));
            String name = stringValue(properties.get("name"));
            Double longitude = coordinates.size() > 0 ? numberValue(coordinates.get(0)) : null;
            Double latitude = coordinates.size() > 1 ? numberValue(coordinates.get(1)) : null;
            Set<String> categories = stringSet(properties.get("categories"));

            if (rawPlaceId == null || name == null || latitude == null || longitude == null
                    || !matchesSpecialty(name, categories, requestedSpecialty)) {
                continue;
            }

            double distanceKm = calculateDistance(userLat, userLng, latitude, longitude);
            if (distanceKm > searchRadiusKm) {
                continue;
            }

            String providerId = "geoapify:" + sha256(rawPlaceId);
            DoctorPlaceResponse provider = new DoctorPlaceResponse(
                    providerId,
                    name,
                    firstNonBlank(stringValue(properties.get("formatted")), stringValue(properties.get("address_line2"))),
                    latitude,
                    longitude,
                    Math.round(distanceKm * 10.0) / 10.0,
                    providerType(categories),
                    specialtyLabel(requestedSpecialty),
                    findString(properties, Set.of("phone", "mobile", "contact:phone")),
                    findString(properties, Set.of("website", "contact:website")),
                    null,
                    distanceKm > requestedRadiusKm);
            unique.putIfAbsent(providerId, provider);
        }

        return unique.values().stream()
                .sorted(Comparator.comparingDouble(DoctorPlaceResponse::distanceKm))
                .toList();
    }

    private static boolean matchesSpecialty(String name, Set<String> categories, String specialty) {
        return switch (specialty) {
            case "maternity" -> categories.stream().anyMatch(value -> value.startsWith("healthcare"))
                    && MATERNITY_NAME.matcher(name).matches();
            case "psychologist" -> categories.contains("healthcare.clinic_or_praxis.psychiatry");
            default -> categories.contains("healthcare.clinic_or_praxis.gynaecology");
        };
    }

    private static String specialtyLabel(String specialty) {
        return switch (specialty) {
            case "maternity" -> "Maternity-related healthcare";
            case "psychologist" -> "Psychiatry / mental health";
            default -> "Gynaecology";
        };
    }

    private static String providerType(Set<String> categories) {
        if (categories.stream().anyMatch(value -> value.contains("hospital"))) {
            return "hospital";
        }
        if (categories.stream().anyMatch(value -> value.contains("clinic_or_praxis"))) {
            return "clinic_or_praxis";
        }
        return "healthcare_facility";
    }

    static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6_371.0088;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder output = new StringBuilder();
            for (byte item : digest) {
                output.append(String.format("%02x", item));
            }
            return output.toString();
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private static String findString(Object node, Set<String> acceptedKeys) {
        if (node instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey()).toLowerCase(Locale.ROOT);
                if (acceptedKeys.contains(key)) {
                    String value = stringValue(entry.getValue());
                    if (value != null) {
                        return value;
                    }
                }
            }
            for (Object value : map.values()) {
                String found = findString(value, acceptedKeys);
                if (found != null) {
                    return found;
                }
            }
        } else if (node instanceof List<?> list) {
            for (Object value : list) {
                String found = findString(value, acceptedKeys);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

    static FailureDiagnostic classifyFailure(Throwable failure) {
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof InterruptedException) {
                return new FailureDiagnostic("INTERRUPTED", "none", current.getClass().getSimpleName());
            }
        }
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof HttpStatusCodeException httpFailure) {
                int status = httpFailure.getStatusCode().value();
                String reason = status == 429 ? "HTTP_429" : status >= 500 ? "HTTP_5XX" : "HTTP_ERROR";
                return new FailureDiagnostic(reason, Integer.toString(status), current.getClass().getSimpleName());
            }
        }
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof SocketTimeoutException
                    || current.getClass().getSimpleName().contains("Timeout")) {
                return new FailureDiagnostic("CONNECT_OR_READ_TIMEOUT", "none", current.getClass().getSimpleName());
            }
        }
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof HttpMessageConversionException
                    || current instanceof ClassCastException
                    || current instanceof GeoapifyProviderException
                    && "Geoapify returned an unexpected response".equals(current.getMessage())) {
                return new FailureDiagnostic("RESPONSE_SHAPE", "none", current.getClass().getSimpleName());
            }
        }
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof ResourceAccessException || current instanceof RestClientException) {
                return new FailureDiagnostic("TRANSPORT_FAILURE", "none", current.getClass().getSimpleName());
            }
        }
        String exceptionName = failure == null ? "none" : failure.getClass().getSimpleName();
        String reason = failure instanceof GeoapifyProviderException
                && "Geoapify API key is not configured".equals(failure.getMessage())
                ? "API_KEY_MISSING"
                : "UNEXPECTED";
        return new FailureDiagnostic(reason, "none", exceptionName);
    }

    record FailureDiagnostic(String reason, String httpStatus, String exceptionName) {
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }

    private static Set<String> stringSet(Object value) {
        if (!(value instanceof List<?> list)) {
            return Set.of();
        }
        LinkedHashSet<String> values = new LinkedHashSet<>();
        for (Object item : list) {
            String text = stringValue(item);
            if (text != null) {
                values.add(text);
            }
        }
        return values;
    }

    private static String firstNonBlank(String first, String second) {
        return first != null ? first : second;
    }

    private static String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private static Double numberValue(Object value) {
        return value instanceof Number number ? number.doubleValue() : null;
    }

    public static class GeoapifyProviderException extends RuntimeException {
        public GeoapifyProviderException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
