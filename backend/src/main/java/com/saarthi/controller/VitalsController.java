package com.saarthi.controller;

import com.saarthi.model.User;
import com.saarthi.model.VitalsLog;
import com.saarthi.repository.UserRepository;
import com.saarthi.repository.VitalsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vitals")
public class VitalsController {

    @Autowired
    private VitalsRepository vitalsRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/log")
    public ResponseEntity<?> addVitalsLog(@RequestBody Map<String, Object> request) {
        User user = getAuthenticatedUser();

        Integer sys = request.get("systolic") != null ? Integer.parseInt(request.get("systolic").toString()) : null;
        Integer dia = request.get("diastolic") != null ? Integer.parseInt(request.get("diastolic").toString()) : null;
        Integer bloodSugar = request.get("bloodSugar") != null ? Integer.parseInt(request.get("bloodSugar").toString()) : null;
        Double weight = request.get("weight") != null ? Double.parseDouble(request.get("weight").toString()) : null;
        Double height = request.get("height") != null ? Double.parseDouble(request.get("height").toString()) : null;
        Double bmi = request.get("bmi") != null ? Double.parseDouble(request.get("bmi").toString()) : null;
        String category = (String) request.getOrDefault("category", "Regular Check");
        String monthLabel = (String) request.getOrDefault("monthLabel", "Jul (Now)");

        VitalsLog log = new VitalsLog(user, LocalDateTime.now(), sys, dia, bloodSugar, weight, height, bmi, category, monthLabel);
        vitalsRepository.save(log);

        return ResponseEntity.ok(Map.of("message", "Vitals logged successfully into database!", "logId", log.getId()));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getVitalsHistory() {
        User user = getAuthenticatedUser();
        List<VitalsLog> logs = vitalsRepository.findByUserOrderByRecordedAtAsc(user);
        return ResponseEntity.ok(logs);
    }
}
