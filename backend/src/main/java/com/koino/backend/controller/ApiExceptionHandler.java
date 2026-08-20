package com.koino.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import com.koino.backend.dto.common.ErrorResponse;
import com.koino.backend.service.DevotionalGenerationException;
import com.koino.backend.service.ModerationUnavailableException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger logger =
        LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException exception) {
        logger.info("Request rejected: {}", exception.getMessage());
        return error(
            HttpStatus.BAD_REQUEST,
            "BAD_REQUEST",
            publicBadRequestMessage(exception.getMessage())
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleConflict(IllegalStateException exception) {
        logger.warn("Request conflict: {}", exception.getMessage());
        return error(
            HttpStatus.CONFLICT,
            "CONFLICT",
            "That action could not be completed right now. Please try again."
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
        MethodArgumentNotValidException exception
    ) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Please check the information you entered and try again.");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(
        MissingServletRequestPartException exception
    ) {
        return error(
            HttpStatus.BAD_REQUEST,
            "MISSING_REQUEST_PART",
            "Please choose the required file and try again."
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleLargeUpload(
        MaxUploadSizeExceededException exception
    ) {
        return error(
            HttpStatus.CONTENT_TOO_LARGE,
            "FILE_TOO_LARGE",
            "This file is too large. Please choose one that is 8 MB or smaller."
        );
    }

    @ExceptionHandler(DevotionalGenerationException.class)
    public ResponseEntity<ErrorResponse> handleDevotionalGeneration(
        DevotionalGenerationException exception
    ) {
        logger.warn("Devotional generation failed", exception);
        return error(
            HttpStatus.BAD_GATEWAY,
            "DEVOTIONAL_GENERATION_FAILED",
            "Today's devotional is temporarily unavailable. Please try again shortly."
        );
    }

    @ExceptionHandler(ModerationUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleModerationUnavailable(ModerationUnavailableException exception) {
        logger.warn("Content moderation unavailable", exception);
        return error(HttpStatus.SERVICE_UNAVAILABLE, "SAFETY_REVIEW_UNAVAILABLE", "Photo safety review is temporarily unavailable. Please try again shortly.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {
        logger.error("Unhandled API error", exception);
        return error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "REQUEST_FAILED",
            "Something went wrong. Please try again shortly."
        );
    }

    private ResponseEntity<ErrorResponse> error(
        HttpStatus status,
        String errorCode,
        String message
    ) {
        return ResponseEntity.status(status).body(new ErrorResponse(
            status.value(),
            errorCode,
            message
        ));
    }

    private String publicBadRequestMessage(String message) {
        if (message == null || message.isBlank()) {
            return "The request could not be completed. Please check your details.";
        }
        String normalized = message.toLowerCase();
        if (
            normalized.contains("exception")
            || normalized.contains("stack trace")
            || normalized.contains("org.springframework")
            || normalized.contains("hibernate")
            || normalized.contains("jdbc")
            || normalized.contains("sqlstate")
            || normalized.contains("constraint")
            || normalized.matches(".*expected \\d+.*resolved \\d+.*")
            || normalized.startsWith("unknown plan:")
        ) {
            return "The request could not be completed. Please try again.";
        }
        return message;
    }
}
