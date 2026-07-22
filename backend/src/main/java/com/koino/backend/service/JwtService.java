package com.koino.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.koino.backend.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final Duration expiration;

    public JwtService(
        SecretKey signingKey,
        @Value("${security.jwt.expiration}") Duration expiration
    ) {
        this.signingKey = signingKey;
        this.expiration = expiration;
    }

    public String generateToken(User user) {
        Instant issuedAt = Instant.now();
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getUserId())
            .claim("fullname", user.getFullname())
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(issuedAt.plus(expiration)))
            .signWith(signingKey)
            .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isValid(String token, User user) {
        try {
            Claims claims = parseClaims(token);
            return user.getEmail().equalsIgnoreCase(claims.getSubject())
                && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
