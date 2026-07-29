package com.koino.backend.dto.battle;

public record BattleMatchmakingResponse(
    String ticketId,
    String status,
    String battleId
) {}
