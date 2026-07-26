package com.koino.backend.service;

public class DevotionalGenerationException extends RuntimeException {
    public DevotionalGenerationException(String message) {
        super(message);
    }

    public DevotionalGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
