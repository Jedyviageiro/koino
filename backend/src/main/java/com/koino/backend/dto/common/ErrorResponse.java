package com.koino.backend.dto.common;

public record ErrorResponse(
    int statusCode,
    String errorCode,
    String message
) {}