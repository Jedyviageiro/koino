package com.koino.backend.dto.battle;

public record BattleModeRatingResponse(
    String mode,
    String modeName,
    int elo,
    String rank,
    int battles,
    int wins,
    int losses,
    int draws,
    int winStreak,
    int bestWinStreak,
    int winRate,
    int nextRankElo
) {}
