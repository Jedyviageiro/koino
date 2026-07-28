package com.koino.backend.dto.bible;

import com.koino.backend.model.Chapter;

public record BibleVerseResponse(
    Long verseId,
    Chapter chapter,
    Integer verseNumber,
    String text
) {
}
