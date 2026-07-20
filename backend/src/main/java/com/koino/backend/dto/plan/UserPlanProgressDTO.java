package com.koino.backend.dto.plan;

public record UserPlanProgressDTO(Long planId, String planName, Integer chaptersCompleted,
    Integer totalChapters,
    Double completionPercentage) {
    
}
