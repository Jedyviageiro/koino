package com.koino.backend.dto.plan;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReadingProgressRequest(
    @NotNull @Min(1) Integer verseIndex
) {}
