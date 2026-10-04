package com.saarthi.dto;

import com.saarthi.model.Appointment;

public record AppointmentResponse(
        Long id,
        String appointmentRef,
        String doctorName,
        String specialty,
        String date,
        String timeSlot,
        String status,
        Integer fee
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentRef(),
                appointment.getDoctorName(),
                appointment.getSpecialty(),
                appointment.getDate(),
                appointment.getTimeSlot(),
                appointment.getStatus(),
                appointment.getFee()
        );
    }
}
