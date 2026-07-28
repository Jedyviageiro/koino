package com.koino.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.EmailVerificationToken;
import com.koino.backend.model.User;
import com.koino.backend.repository.EmailVerificationTokenRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.GmailService.EmailService;

@Service
public class EmailVerificationService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final Duration expiration;
    private final String frontendUrl;

    public EmailVerificationService(
        EmailVerificationTokenRepository tokenRepository,
        UserRepository userRepository,
        EmailService emailService,
        @Value("${security.email-verification.expiration}") Duration expiration,
        @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.expiration = expiration;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void sendVerification(User user) {
        if (user.isEmailVerified()) {
            return;
        }
        var latest = tokenRepository.findTopByUserIdOrderByCreatedAtDesc(
            user.getUserId()
        );
        if (latest.isPresent()
            && latest.get().getCreatedAt().plus(RESEND_COOLDOWN)
                .isAfter(Instant.now())) {
            return;
        }

        tokenRepository.deleteByUserId(user.getUserId());
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(bytes);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setTokenHash(hash(rawToken));
        token.setUserId(user.getUserId());
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(expiration));
        token.setUsed(false);
        tokenRepository.save(token);

        emailService.sendEmailVerification(
            user,
            frontendUrl + "/verify-email?token=" + rawToken,
            expiration
        );
    }

    @Transactional
    public User confirm(String rawToken) {
        EmailVerificationToken token = tokenRepository.findByTokenHash(
            hash(rawToken)
        ).orElseThrow(() -> new IllegalArgumentException(
            "This verification link is invalid"
        ));
        if (token.isUsed() || !token.getExpiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException(
                "This verification link has expired"
            );
        }
        User user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new IllegalArgumentException(
                "This verification link is invalid"
            ));
        user.setEmailVerified(true);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        token.setUsed(true);
        tokenRepository.save(token);
        return user;
    }

    @Transactional
    public void resend(String email) {
        User user = userRepository.findByEmail(
            email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT)
        );
        if (user != null && user.isActive() && !user.isEmailVerified()) {
            sendVerification(user);
        }
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(
                    value.getBytes(StandardCharsets.UTF_8)
                )
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
