package com.koino.backend.dto.plan;

public record PlanTemplateDTO(
    Long id,
    String name,
    String description,
    Integer totalChapters
) {}