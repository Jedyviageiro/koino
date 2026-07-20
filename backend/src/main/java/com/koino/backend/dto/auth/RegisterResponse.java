package com.koino.backend.dto.auth;

public record RegisterResponse(Long id, String token, String email, String fullname) {
    
}
