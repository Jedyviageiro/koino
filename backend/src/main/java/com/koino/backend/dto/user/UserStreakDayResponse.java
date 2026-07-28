package com.koino.backend.dto.user;

import java.time.LocalDate;

public record UserStreakDayResponse(
    LocalDate date,
    boolean active
) {
}
