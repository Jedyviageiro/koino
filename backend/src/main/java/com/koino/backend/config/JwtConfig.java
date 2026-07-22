package com.koino.backend.config;

import java.util.Base64;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.jsonwebtoken.security.Keys;

@Configuration
public class JwtConfig {

    @Bean
    public SecretKey jwtSigningKey(@Value("${security.jwt.secret}") String encodedSecret) {
        byte[] secret = Base64.getDecoder().decode(encodedSecret);
        if (secret.length < 32) {
            throw new IllegalArgumentException(
                "security.jwt.secret must contain at least 32 decoded bytes"
            );
        }
        return Keys.hmacShaKeyFor(secret);
    }
}
