package com.koino.backend.dto.battle;

import java.util.List;
import java.util.Map;

public record BattleLobbyResponse(
    BattleProfileResponse profile,
    List<BattleModeResponse> modes,
    Map<String, List<BattleLeaderboardEntryResponse>> leaderboards,
    boolean beta
) {
}
