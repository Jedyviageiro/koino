package com.koino.backend.dto.battle;

public record BattleModeResponse(
    String mode,
    String name,
    int questions,
    int durationSeconds
) {
}
