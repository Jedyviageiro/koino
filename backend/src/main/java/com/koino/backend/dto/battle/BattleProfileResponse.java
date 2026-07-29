package com.koino.backend.dto.battle;

import java.util.List;

public record BattleProfileResponse(
    List<BattleModeRatingResponse> ratings,
    int totalBattles,
    int totalWins
) {}
