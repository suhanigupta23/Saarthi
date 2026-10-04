package com.saarthi.repository;

import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserOrderByCreatedAtDesc(User user);
    Optional<Appointment> findByAppointmentRef(String appointmentRef);
    Optional<Appointment> findByAppointmentRefAndUser(String appointmentRef, User user);
    boolean existsByAppointmentRefAndUser_UsernameAndMode(String appointmentRef, String username, String mode);
    long countByProviderIdAndDateAndTimeSlot(String providerId, String date, String timeSlot);
}
