package com.koino.backend.dto.user;

import java.time.Instant;

public record VerseBookmarkResponse(
    Long bookmarkId,
    Long verseId,
    String book,
    Long chapterId,
    Integer chapterNumber,
    Integer verseNumber,
    String text,
    Instant bookmarkedAt
) {}
