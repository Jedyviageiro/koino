package com.koino.backend.dto.plan;

import java.time.Instant;

public record UserTaskDevotionalResponse(
    Long devotionalId,
    Long taskId,
    String readingAssignment,
    Integer estimatedMinutes,
    Integer verseCount,
    String title,
    String anchorVerseReference,
    String anchorVerseText,
    String opening,
    String reflection,
    String application,
    String prayer,
    Instant generatedAt
) {}
