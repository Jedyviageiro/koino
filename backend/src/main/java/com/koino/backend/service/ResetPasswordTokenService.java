package com.koino.backend.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.ResetPasswordToken;
import com.koino.backend.model.User;
import com.koino.backend.repository.ResetPasswordTokenRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class ResetPasswordTokenService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ResetPasswordTokenRepository resetPasswordTokenRepository;
    private final UserRepository userRepository;
    private final Duration expiration;

    public ResetPasswordTokenService(
        ResetPasswordTokenRepository resetPasswordTokenRepository,
        UserRepository userRepository,
        @Value("${security.password-reset.expiration}") Duration expiration
    ) {
        this.resetPasswordTokenRepository = resetPasswordTokenRepository;
        this.userRepository = userRepository;
        this.expiration = expiration;
    }

    @Transactional
    public ResetPasswordToken generateToken(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user was found with that email");
        }

        resetPasswordTokenRepository.deleteByUserId(user.getUserId());

        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);

        ResetPasswordToken resetToken = new ResetPasswordToken();
        resetToken.setToken(Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes));
        resetToken.setUserId(user.getUserId());
        resetToken.setExpiresAt(Instant.now().plus(expiration));
        resetToken.setUsed(false);
        return resetPasswordTokenRepository.save(resetToken);
    }

    public ResetPasswordToken validateToken(String token) {
        ResetPasswordToken resetToken = resetPasswordTokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token"));
        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("Password reset token is expired or already used");
        }
        return resetToken;
    }
}
