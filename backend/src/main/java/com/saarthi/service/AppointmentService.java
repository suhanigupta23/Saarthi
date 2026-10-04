package com.saarthi.service;

import com.saarthi.dto.AppointmentResponse;
import com.saarthi.dto.CreateAppointmentRequest;
import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AppointmentService {

    private static final String SLOT_CONSTRAINT = "uk_appointment_provider_date_time";
    private static final String PENDING_PAYMENT = "PENDING_PAYMENT";
    private static final int DEMO_CONSULTATION_FEE = 500;

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional
    public AppointmentResponse book(User user, CreateAppointmentRequest request) {
        String appointmentRef = "APT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Appointment appointment = new Appointment(
                user,
                appointmentRef,
                request.providerId().trim(),
                request.doctorName().trim(),
                request.specialty().trim(),
                request.clinicName().trim(),
                request.date().trim(),
                request.timeSlot().trim(),
                request.mode().trim(),
                PENDING_PAYMENT,
                DEMO_CONSULTATION_FEE,
                LocalDateTime.now()
        );

        try {
            return AppointmentResponse.from(appointmentRepository.saveAndFlush(appointment));
        } catch (DataIntegrityViolationException exception) {
            if (isSlotConstraintViolation(exception)) {
                throw new SlotAlreadyBookedException("This consultation slot has already been booked.", exception);
            }
            throw exception;
        }
    }

    private boolean isSlotConstraintViolation(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof org.hibernate.exception.ConstraintViolationException constraintViolation) {
                String constraintName = constraintViolation.getConstraintName();
                if (containsSlotConstraint(constraintName)) {
                    return true;
                }
            }
            if (containsSlotConstraint(current.getMessage())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean containsSlotConstraint(String value) {
        return value != null && value.toLowerCase().contains(SLOT_CONSTRAINT);
    }

    public static class SlotAlreadyBookedException extends RuntimeException {
        public SlotAlreadyBookedException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
