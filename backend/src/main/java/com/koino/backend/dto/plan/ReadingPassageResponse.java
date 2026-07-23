package com.koino.backend.dto.plan;

public record ReadingPassageResponse(
    Long passageId,
    Long chapterId,
    Integer bookId,
    String bookTitle,
    Integer chapterNumber,
    Integer firstVerse,
    Integer lastVerse
) {}
