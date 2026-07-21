package com.saarthi.repository;

import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserOrderByCreatedAtDesc(User user);
}
