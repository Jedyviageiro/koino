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
    private final Duration refreshExpiration;

    public JwtService(
        SecretKey signingKey,
        @Value("${security.jwt.expiration}") Duration expiration,
        @Value("${security.jwt.refresh-expiration}") Duration refreshExpiration
    ) {
        this.signingKey = signingKey;
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
    }

    public String generateToken(User user) {
        return generateToken(user, expiration, "access");
    }

    public String generateRefreshToken(User user) {
        return generateToken(user, refreshExpiration, "refresh");
    }

    private String generateToken(User user, Duration lifetime, String type) {
        Instant issuedAt = Instant.now();
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getUserId())
            .claim("fullname", user.getFullname())
            .claim("type", type)
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(issuedAt.plus(lifetime)))
            .signWith(signingKey)
            .compact();
    }

    public boolean isRefreshTokenValid(String token, User user) {
        try {
            Claims claims = parseClaims(token);
            return user.isActive()
                && "refresh".equals(claims.get("type", String.class))
                && user.getEmail().equalsIgnoreCase(claims.getSubject())
                && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isValid(String token, User user) {
        try {
            Claims claims = parseClaims(token);
            String tokenType = claims.get("type", String.class);
            return user.isActive()
                && (tokenType == null || "access".equals(tokenType))
                && user.getEmail().equalsIgnoreCase(claims.getSubject())
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
