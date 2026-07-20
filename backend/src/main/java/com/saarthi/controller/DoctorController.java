package com.saarthi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;

import java.util.*;

@RestController
@RequestMapping("/api")
public class DoctorController {

    private static final List<Map<String, Object>> DEFAULT_DOCTORS = new ArrayList<>();

    static {
        DEFAULT_DOCTORS.add(createDoctor("1", "Dr. Neha Jain", 4.8, "Aarogya Gynae Clinic", "Gwalior", "10 AM - 1 PM", "Obstetrician & Gynecologist", 26.2183, 78.1828));
        DEFAULT_DOCTORS.add(createDoctor("2", "Dr. Smita Agrawal", 4.6, "Indira IVF Hospital", "Gwalior", "9:30 AM - 2 PM", "IVF & Fertility Specialist", 26.2224, 78.1780));
        DEFAULT_DOCTORS.add(createDoctor("3", "Dr. Ritu Bhargava", 4.7, "Bhargava Women’s Clinic", "Gwalior", "5 PM - 8 PM", "Endometriosis & Laparoscopy Expert", 26.2251, 78.1902));
        DEFAULT_DOCTORS.add(createDoctor("4", "Dr. Shalini Gupta", 4.9, "Apex Super Speciality Hospital", "Delhi NCR", "11 AM - 4 PM", "Maternal Fetal Medicine Expert", 28.6139, 77.2090));
        DEFAULT_DOCTORS.add(createDoctor("5", "Dr. Priyamvada Reddy", 4.5, "Reddy Clinic", "Hyderabad", "10 AM - 6 PM", "PCOS & Hormonal Specialist", 17.3850, 78.4867));
    }

    private static Map<String, Object> createDoctor(String id, String name, double rating, String clinic, String city, String timing, String speciality, double lat, double lng) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", id);
        doc.put("name", name);
        doc.put("rating", rating);
        doc.put("clinic", clinic);
        doc.put("city", city);
        doc.put("timing", timing);
        doc.put("speciality", speciality);
        doc.put("lat", lat);
        doc.put("lng", lng);
        return doc;
    }

    @GetMapping("/gynecologists")
    @Cacheable(value = "gynecologists", key = "{#lat, #lng, #radius_km}")
    public ResponseEntity<?> getNearbyGynecologists(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "100") double radius_km) {

        List<Map<String, Object>> filtered = new ArrayList<>();

        for (Map<String, Object> doc : DEFAULT_DOCTORS) {
            double docLat = (double) doc.get("lat");
            double docLng = (double) doc.get("lng");
            
            // Calculate distance using simple spherical law of cosines
            double distance = calculateDistance(lat, lng, docLat, docLng);
            
            if (distance <= radius_km) {
                Map<String, Object> docWithDist = new HashMap<>(doc);
                docWithDist.put("distance_km", Math.round(distance * 10.0) / 10.0);
                filtered.add(docWithDist);
            }
        }

        // If no doctors are found within the radius, return all doctors as default fallback
        if (filtered.isEmpty()) {
            return ResponseEntity.ok(DEFAULT_DOCTORS);
        }

        return ResponseEntity.ok(filtered);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + 
                      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
        dist = Math.acos(dist);
        dist = rad2deg(dist);
        dist = dist * 60 * 1.1515 * 1.609344; // Convert to kilometers
        return (dist);
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    private double rad2deg(double rad) {
        return (rad * 180.0 / Math.PI);
    }
}
