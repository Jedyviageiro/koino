package com.koino.backend.dto.auth;

public record LoginResponse(Long id, String token, String email, String fullname) {
    
}
