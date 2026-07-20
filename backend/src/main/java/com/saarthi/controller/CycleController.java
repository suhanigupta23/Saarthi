package com.saarthi.controller;

import com.saarthi.model.CycleLog;
import com.saarthi.model.User;
import com.saarthi.repository.CycleLogRepository;
import com.saarthi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cycle")
public class CycleController {

    @Autowired
    private CycleLogRepository cycleLogRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/log")
    public ResponseEntity<?> addCycleLog(@RequestBody Map<String, String> request) {
        User user = getAuthenticatedUser();
        LocalDate startDate = LocalDate.parse(request.get("startDate"));
        String mood = request.getOrDefault("mood", "");
        String flow = request.getOrDefault("flow", "");
        String symptoms = request.getOrDefault("symptoms", "");

        CycleLog log = new CycleLog(user, startDate, mood, flow, symptoms);
        cycleLogRepository.save(log);

        return ResponseEntity.ok(Map.of("message", "Cycle logged successfully!"));
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getCycleLogs() {
        User user = getAuthenticatedUser();
        List<CycleLog> logs = cycleLogRepository.findByUserOrderByStartDateDesc(user);
        return ResponseEntity.ok(logs);
    }
}
