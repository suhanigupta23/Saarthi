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
        String osmUrl,
        boolean outsideRequestedRadius,
        String matchClassification
) {
    public DoctorPlaceResponse(
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
            String osmUrl) {
        this(providerId, name, address, latitude, longitude, distanceKm, providerType,
                specialty, phone, website, osmUrl, false, "EXACT_CATEGORY");
    }
}
