package com.koino.backend.service;

public class ModerationUnavailableException extends RuntimeException {
    public ModerationUnavailableException(String message) { super(message); }
    public ModerationUnavailableException(String message, Throwable cause) { super(message, cause); }
}
