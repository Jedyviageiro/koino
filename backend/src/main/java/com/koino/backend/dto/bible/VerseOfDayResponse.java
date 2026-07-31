package com.koino.backend.dto.bible;

public record VerseOfDayResponse(
    String reference,
    String text,
    String theme,
    String monthDay
) {}
