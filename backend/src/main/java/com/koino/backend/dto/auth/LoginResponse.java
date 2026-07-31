package com.koino.backend.dto.auth;

public record LoginResponse(
    Long id,
    String token,
    String refreshToken,
    String email,
    String fullname,
    String profilePictureUrl
) {
    
}
