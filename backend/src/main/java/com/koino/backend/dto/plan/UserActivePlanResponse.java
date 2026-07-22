package com.koino.backend.dto.plan;

import java.time.LocalDate;

public record UserActivePlanResponse(
    Long activePlanId,
    String planCode,
    String name,
    Integer sequenceNumber,
    LocalDate startDate,
    LocalDate estimatedFinishDate,
    Integer estimatedMinutesPerDay,
    int completedDays,
    int totalDays,
    double completionPercentage,
    boolean completed
) {}
