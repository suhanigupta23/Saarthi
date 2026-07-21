package com.saarthi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String appointmentRef;

    private String doctorName;
    private String specialty;
    private String clinicName;
    private String date;
    private String timeSlot;
    private String mode; // 'Online Video Call' or 'Visit Doctor Nearby'
    private String status; // 'Booked', 'Completed', 'Cancelled'
    private Integer fee;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Appointment() {}

    public Appointment(User user, String appointmentRef, String doctorName, String specialty, String clinicName, String date, String timeSlot, String mode, String status, Integer fee, LocalDateTime createdAt) {
        this.user = user;
        this.appointmentRef = appointmentRef;
        this.doctorName = doctorName;
        this.specialty = specialty;
        this.clinicName = clinicName;
        this.date = date;
        this.timeSlot = timeSlot;
        this.mode = mode;
        this.status = status;
        this.fee = fee;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getAppointmentRef() { return appointmentRef; }
    public void setAppointmentRef(String appointmentRef) { this.appointmentRef = appointmentRef; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getFee() { return fee; }
    public void setFee(Integer fee) { this.fee = fee; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
