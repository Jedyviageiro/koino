package com.koino.backend.dto.user;

import java.time.LocalDate;
import java.util.List;

public record UserStreakResponse(
    int currentStreak,
    int longestStreak,
    LocalDate lastLoginDate,
    List<UserStreakDayResponse> recentDays
) {}
