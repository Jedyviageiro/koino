package com.koino.backend.dto.community;

public record CommunityVerseResponse(
    Long verseId,
    String reference,
    String text
) {
}
