package com.koino.backend.dto.user;

import java.time.LocalDateTime;
import java.util.List;

public record PublicUserProfileResponse(
    Long userId,
    String username,
    String fullname,
    String profilePictureUrl,
    LocalDateTime joinedAt,
    String bio,
    String location,
    String countryCode,
    String friendshipStatus,
    Long friendshipId,
    long friendsCount,
    long postsCount,
    PublicPlanResponse currentPlan,
    PublicBattleResponse battle
) {
    public record PublicPlanResponse(
        String planCode,
        String name,
        String description,
        int durationDays,
        int estimatedMinutesPerDay
    ) {}

    public record PublicBattleResponse(
        int battles,
        int wins,
        int winRate,
        List<PublicModeRatingResponse> ratings
    ) {}

    public record PublicModeRatingResponse(
        String mode,
        String modeName,
        int elo,
        String rank,
        int battles,
        int wins,
        int winRate
    ) {}
}
