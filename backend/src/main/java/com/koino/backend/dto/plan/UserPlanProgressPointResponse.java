package com.koino.backend.dto.plan;

import java.time.Instant;
import java.time.LocalDate;

public record UserPlanProgressPointResponse(
    Long taskId,
    Integer dayNumber,
    LocalDate scheduledDate,
    boolean completed,
    Instant completedAt,
    int cumulativeCompletedDays,
    double completionPercentage
) {}
