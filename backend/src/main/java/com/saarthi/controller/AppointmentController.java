package com.saarthi.controller;

import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> request) {
        User user = getAuthenticatedUser();

        String ref = (String) request.getOrDefault("appointmentRef", "APT-" + (System.currentTimeMillis() % 10000));
        String doctorName = (String) request.getOrDefault("doctorName", "Specialist Doctor");
        String specialty = (String) request.getOrDefault("specialty", "Gynecologist");
        String clinicName = (String) request.getOrDefault("clinicName", "Saarthi Telehealth Clinic");
        String date = (String) request.getOrDefault("date", "Today");
        String timeSlot = (String) request.getOrDefault("timeSlot", "10:00 AM");
        String mode = (String) request.getOrDefault("mode", "Online Video Call");
        String status = (String) request.getOrDefault("status", "Booked");
        Integer fee = request.get("fee") != null ? Integer.parseInt(request.get("fee").toString()) : 400;

        Appointment appointment = new Appointment(user, ref, doctorName, specialty, clinicName, date, timeSlot, mode, status, fee, LocalDateTime.now());
        appointmentRepository.save(appointment);

        return ResponseEntity.ok(Map.of("message", "Appointment saved into DB successfully!", "appointmentId", appointment.getId(), "ref", ref));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyAppointments() {
        User user = getAuthenticatedUser();
        List<Appointment> list = appointmentRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(list);
    }
}
