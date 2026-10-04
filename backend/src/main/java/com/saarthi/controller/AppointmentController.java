package com.saarthi.controller;

import com.saarthi.dto.CreateAppointmentRequest;
import com.saarthi.dto.AppointmentResponse;
import com.saarthi.exception.InvalidApiRequestException;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.UserRepository;
import com.saarthi.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AppointmentService appointmentService;

    public AppointmentController(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            AppointmentService appointmentService) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.appointmentService = appointmentService;
    }

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("Authenticated user was not found"));
    }

    @PostMapping("/book")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        User user = getAuthenticatedUser();

        String validationError = validate(request);
        if (validationError != null) {
            throw new InvalidApiRequestException(validationError);
        }

        AppointmentResponse response = appointmentService.book(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyAppointments() {
        User user = getAuthenticatedUser();
        List<AppointmentResponse> list = appointmentRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(AppointmentResponse::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    private String validate(CreateAppointmentRequest request) {
        if (request == null) return "Appointment details are required";
        if (isBlank(request.providerId())) return "Provider identity is required";
        if (isBlank(request.doctorName())) return "Provider name is required";
        if (isBlank(request.specialty())) return "Specialty is required";
        if (isBlank(request.clinicName())) return "Clinic or provider address is required";
        if (isBlank(request.date())) return "Appointment date is required";
        try {
            LocalDate.parse(request.date());
        } catch (DateTimeParseException exception) {
            return "Appointment date must use ISO format YYYY-MM-DD";
        }
        if (isBlank(request.timeSlot())) return "Appointment time is required";
        if (!"Online Video Call".equals(request.mode()) && !"Visit Doctor Nearby".equals(request.mode())) {
            return "Unsupported consultation mode";
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
