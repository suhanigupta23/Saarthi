package com.saarthi.repository;

import com.saarthi.model.CycleLog;
import com.saarthi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CycleLogRepository extends JpaRepository<CycleLog, Long> {
    List<CycleLog> findByUserOrderByStartDateDesc(User user);
}
