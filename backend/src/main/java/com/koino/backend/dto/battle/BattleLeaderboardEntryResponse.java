package com.koino.backend.dto.battle;

public record BattleLeaderboardEntryResponse(
    int position,
    Long userId,
    String fullname,
    String profilePictureUrl,
    int elo,
    String rank,
    boolean currentUser
) {
}
