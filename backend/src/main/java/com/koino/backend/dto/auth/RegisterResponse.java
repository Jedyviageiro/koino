package com.koino.backend.dto.auth;

public record RegisterResponse(
    Long id,
    String email,
    String fullname,
    boolean verificationRequired
) {
    
}
