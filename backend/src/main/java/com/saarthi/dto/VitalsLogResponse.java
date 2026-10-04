package com.saarthi.dto;

import com.saarthi.model.VitalsLog;

public record VitalsLogResponse(
        String monthLabel,
        Integer systolic,
        Integer diastolic,
        Integer bloodSugar,
        Double weight
) {
    public static VitalsLogResponse from(VitalsLog log) {
        return new VitalsLogResponse(
                log.getMonthLabel(),
                log.getSystolic(),
                log.getDiastolic(),
                log.getBloodSugar(),
                log.getWeight()
        );
    }
}
