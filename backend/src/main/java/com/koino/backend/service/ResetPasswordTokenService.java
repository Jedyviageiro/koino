package com.koino.backend.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.koino.backend.model.ResetPasswordToken;
import com.koino.backend.model.User;
import com.koino.backend.repository.ResetPasswordTokenRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.GmailService.EmailService;
import com.koino.backend.utils.PasswordPolicy;

@Service
public class ResetPasswordTokenService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration REQUEST_COOLDOWN = Duration.ofSeconds(60);

    private final ResetPasswordTokenRepository resetPasswordTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Duration expiration;
    private final EmailService emailService;
    private final String frontendUrl;

    public ResetPasswordTokenService(
        ResetPasswordTokenRepository resetPasswordTokenRepository,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        @Value("${security.password-reset.expiration}") Duration expiration,
        EmailService emailService,
        @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.resetPasswordTokenRepository = resetPasswordTokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.expiration = expiration;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public ResetPasswordToken generateToken(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null || !user.isActive()) {
            throw new IllegalArgumentException("No user was found with that email");
        }

        var latest = resetPasswordTokenRepository
            .findTopByUserIdOrderByIdDesc(user.getUserId());
        if (latest.isPresent()
            && latest.get().getExpiresAt()
                .minus(expiration)
                .plus(REQUEST_COOLDOWN)
                .isAfter(Instant.now())) {
            return latest.get();
        }
        resetPasswordTokenRepository.deleteByUserId(user.getUserId());

        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(tokenBytes);

        ResetPasswordToken resetToken = new ResetPasswordToken();
        resetToken.setToken(hash(rawToken));
        resetToken.setUserId(user.getUserId());
        resetToken.setExpiresAt(Instant.now().plus(expiration));
        resetToken.setUsed(false);
        resetToken = resetPasswordTokenRepository.save(resetToken);
        emailService.sendPasswordReset(
            user,
            frontendUrl + "/reset-password?token=" + rawToken,
            expiration
        );
        return resetToken;
    }

    public ResetPasswordToken validateToken(String token) {
        ResetPasswordToken resetToken = resetPasswordTokenRepository.findByToken(
            hash(token)
        )
            .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token"));
        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("Password reset token is expired or already used");
        }
        User user = userRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token"));
        if (!user.isActive()) {
            throw new IllegalArgumentException("Invalid password reset token");
        }
        return resetToken;
    }

    @Transactional
    public void saveNewPassword(
        String newPassword,
        String confirmPassword,
        String token
    ) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("The new passwords do not match");
        }
        PasswordPolicy.requireStrong(newPassword);

        ResetPasswordToken resetToken = resetPasswordTokenRepository
            .findByTokenForUpdate(hash(token))
            .orElseThrow(() -> new IllegalArgumentException(
                "Invalid password reset token"
            ));
        validateUsableToken(resetToken);

        User user = userRepository.findById(resetToken.getUserId())
            .filter(User::isActive)
            .orElseThrow(() -> new IllegalArgumentException(
                "Invalid password reset token"
            ));
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException(
                "Choose a password you have not used for this account"
            );
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsed(true);
        resetPasswordTokenRepository.save(resetToken);
    }

    private void validateUsableToken(ResetPasswordToken resetToken) {
        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException(
                "Password reset token is expired or already used"
            );
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
