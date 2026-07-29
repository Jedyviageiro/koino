package com.koino.backend.dto.battle;

import com.koino.backend.model.BattleMode;

import jakarta.validation.constraints.NotNull;

public record CreateBattleChallengeRequest(
    @NotNull Long userId,
    @NotNull BattleMode mode
) {}
