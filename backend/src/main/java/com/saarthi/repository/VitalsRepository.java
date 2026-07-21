package com.saarthi.repository;

import com.saarthi.model.User;
import com.saarthi.model.VitalsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VitalsRepository extends JpaRepository<VitalsLog, Long> {
    List<VitalsLog> findByUserOrderByRecordedAtAsc(User user);
}
