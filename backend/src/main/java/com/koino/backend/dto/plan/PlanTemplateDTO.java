package com.koino.backend.dto.plan;

public record PlanTemplateDTO(
    Long planTemplateId,
    String name,
    String description,
    String difficulty,
    Integer durationDays,
    Integer totalChapters,
    String bookNames,
    Integer estimatedMinutesPerDay
) {}