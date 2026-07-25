package com.koino.backend.dto.user;

import jakarta.validation.constraints.Pattern;

public record BookmarkVerseRequest(
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String highlightColor
) {}
