package com.saarthi.dto;

public record DoctorPlaceResponse(
        String providerId,
        String name,
        String address,
        double latitude,
        double longitude,
        double distanceKm,
        String providerType,
        String specialty,
        String phone,
        String website,
        String osmUrl
) {
}
