package com.koino.backend.dto.plan;

public record ChapterUpdateDTO(
    Long chapterId,
    boolean isRead
) {}