package com.koino.backend.dto.battle;

import java.time.Instant;

public record BattleStateResponse(
    String battleId,
    String mode,
    String modeName,
    String status,
    int durationSeconds,
    Instant startedAt,
    Instant expiresAt,
    int currentQuestionIndex,
    int playerScore,
    int opponentScore,
    String opponentName,
    int opponentElo,
    String opponentType,
    BattleQuestionResponse currentQuestion,
    Integer ratingBefore,
    Integer ratingChange,
    Integer ratingAfter,
    String result,
    Long opponentUserId
) {
}
