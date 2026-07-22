package com.koino.backend.dto.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OnboardingRequest
(
    @NotBlank String journeyDescription,
    @NotBlank String preferredStartingPoint,
    @NotBlank String dailyRhythm,
    @NotBlank String workPace,
    @NotNull @Min(10) @Max(30) Integer dailyCapacityMinutes
) {
    
}
