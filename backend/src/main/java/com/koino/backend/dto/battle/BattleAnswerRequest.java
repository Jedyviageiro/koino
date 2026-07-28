package com.koino.backend.dto.battle;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BattleAnswerRequest(
    @NotNull Long questionId,
    @Min(0) @Max(3) int selectedOption
) {
}
