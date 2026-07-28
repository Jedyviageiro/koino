package com.koino.backend.dto.battle;

public record BattleAnswerResponse(
    boolean correct,
    int correctOption,
    String explanation,
    String reference,
    int pointsAwarded,
    BattleStateResponse battle
) {
}
