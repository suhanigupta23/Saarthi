package com.saarthi.dto;

import com.saarthi.model.CycleLog;

import java.time.LocalDate;

public record CycleLogResponse(
        Long id,
        LocalDate startDate,
        String mood,
        String flow,
        String symptoms
) {
    public static CycleLogResponse from(CycleLog log) {
        return new CycleLogResponse(
                log.getId(),
                log.getStartDate(),
                log.getMood(),
                log.getFlow(),
                log.getSymptoms()
        );
    }
}
