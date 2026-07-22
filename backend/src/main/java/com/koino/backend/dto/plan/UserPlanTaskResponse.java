package com.koino.backend.dto.plan;

import java.time.LocalDate;

public record UserPlanTaskResponse(
    Long taskId,
    Integer dayNumber,
    LocalDate scheduledDate,
    String readingAssignment,
    boolean completed
) {}
