package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;

import com.koino.backend.model.User;
import com.koino.backend.service.JwtService;

import io.jsonwebtoken.security.Keys;

class JwtServiceTests {
    private static final SecretKey SECRET = Keys.hmacShaKeyFor(
        "a-test-secret-that-is-at-least-thirty-two-bytes-long".getBytes()
    );

    private final JwtService jwtService = new JwtService(SECRET, Duration.ofHours(1));

    @Test
    void generatesAndValidatesTokenForUser() {
        User user = user(42L, "reader@koino.local", "Koino Reader");

        String token = jwtService.generateToken(user);

        assertThat(jwtService.extractEmail(token)).isEqualTo(user.getEmail());
        assertThat(jwtService.isValid(token, user)).isTrue();
    }

    @Test
    void rejectsTokenForAnotherUserAndRejectsTampering() {
        User owner = user(42L, "reader@koino.local", "Koino Reader");
        User anotherUser = user(84L, "another@koino.local", "Another Reader");
        String token = jwtService.generateToken(owner);
        String[] tokenParts = token.split("\\.");
        char replacement = tokenParts[1].charAt(0) == 'a' ? 'b' : 'a';
        tokenParts[1] = replacement + tokenParts[1].substring(1);
        String tamperedToken = String.join(".", tokenParts);

        assertThat(jwtService.isValid(token, anotherUser)).isFalse();
        assertThat(jwtService.isValid(tamperedToken, owner)).isFalse();
    }

    private User user(Long id, String email, String fullname) {
        User user = new User();
        user.setUserId(id);
        user.setEmail(email);
        user.setFullname(fullname);
        return user;
    }
}
