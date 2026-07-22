package com.koino.backend.dto.user;

import java.time.LocalDate;

public record UserStreakResponse(
    int currentStreak,
    int longestStreak,
    LocalDate lastLoginDate
) {}
