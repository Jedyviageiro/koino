package com.koino.backend.dto.battle;

import java.time.Instant;

public record BattleStateResponse(
    String battleId,
    String mode,
    String modeName,
    String status,
    int questionCount,
    int durationSeconds,
    Instant startedAt,
    Instant expiresAt,
    int currentQuestionIndex,
    int playerScore,
    int opponentScore,
    String opponentName,
    int opponentElo,
    BattleQuestionResponse currentQuestion,
    Integer ratingBefore,
    Integer ratingChange,
    Integer ratingAfter,
    String result
) {
}
