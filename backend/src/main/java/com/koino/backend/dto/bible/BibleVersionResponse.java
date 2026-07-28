package com.koino.backend.dto.bible;

public record BibleVersionResponse(
    String code,
    String name,
    String copyrightNotice
) {
}
