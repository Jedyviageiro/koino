package com.koino.backend.dto.battle;

import java.util.List;

public record BattleLobbyResponse(
    BattleProfileResponse profile,
    List<BattleModeResponse> modes,
    List<BattleLeaderboardEntryResponse> leaderboard,
    boolean beta
) {
}
