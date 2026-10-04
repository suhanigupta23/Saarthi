package com.saarthi.controller;

import com.saarthi.dto.DoctorPlaceResponse;
import com.saarthi.exception.InvalidApiRequestException;
import com.saarthi.service.OsmProviderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class DoctorController {

    private static final Set<String> SUPPORTED_SPECIALTIES = Set.of("gyno", "maternity", "psychologist");
    private final OsmProviderService osmProviderService;

    public DoctorController(OsmProviderService osmProviderService) {
        this.osmProviderService = osmProviderService;
    }

    @GetMapping("/gynecologists")
    public ResponseEntity<?> getNearbyGynecologists(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25") double radius_km,
            @RequestParam(defaultValue = "gyno") String specialty) {

        if (!Double.isFinite(lat) || !Double.isFinite(lng) || !Double.isFinite(radius_km)
                || lat < -90 || lat > 90 || lng < -180 || lng > 180
                || radius_km <= 0 || radius_km > 25) {
            throw new InvalidApiRequestException(
                    "Latitude, longitude, or radius is outside the valid range; radius must be at most 25 km");
        }

        String normalizedSpecialty = specialty == null ? "" : specialty.trim().toLowerCase();
        if (!SUPPORTED_SPECIALTIES.contains(normalizedSpecialty)) {
            throw new InvalidApiRequestException("Unsupported specialty");
        }

        List<DoctorPlaceResponse> providers = osmProviderService.searchNearbyProviders(
                lat, lng, radius_km, normalizedSpecialty
        );
        return ResponseEntity.ok(providers);
    }
}
