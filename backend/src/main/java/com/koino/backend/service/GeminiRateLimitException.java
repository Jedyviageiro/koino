package com.koino.backend.service;

public class GeminiRateLimitException extends DevotionalGenerationException {
    public GeminiRateLimitException(String message) {
        super(message);
    }
}
