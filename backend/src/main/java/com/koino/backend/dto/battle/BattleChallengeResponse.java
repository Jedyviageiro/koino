package com.koino.backend.dto.battle;

import java.time.Instant;

import com.koino.backend.dto.user.FriendUserResponse;

public record BattleChallengeResponse(
    String challengeId,
    String status,
    String mode,
    String modeName,
    FriendUserResponse challenger,
    FriendUserResponse addressee,
    String battleId,
    Instant expiresAt
) {}
