package com.koino.backend.dto.plan;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record UserPlanTaskResponse(
    Long taskId,
    Integer dayNumber,
    LocalDate scheduledDate,
    String readingAssignment,
    Integer estimatedMinutes,
    Integer currentVerseIndex,
    boolean completed,
    Instant completedAt,
    List<ReadingPassageResponse> passages
) {}
