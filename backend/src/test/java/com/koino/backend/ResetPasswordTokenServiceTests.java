package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.koino.backend.model.ResetPasswordToken;
import com.koino.backend.model.User;
import com.koino.backend.repository.ResetPasswordTokenRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.ResetPasswordTokenService;
import com.koino.backend.service.GmailService.EmailService;

class ResetPasswordTokenServiceTests {

    @Test
    void savesEncodedPasswordAndConsumesToken() {
        ResetPasswordTokenRepository tokenRepository = mock(
            ResetPasswordTokenRepository.class
        );
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        ResetPasswordToken token = validToken();
        User user = new User();
        user.setUserId(42L);
        user.setActive(true);

        when(tokenRepository.findByTokenForUpdate(anyString()))
            .thenReturn(Optional.of(token));
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(encoder.encode("New-password1!")).thenReturn("encoded-password");

        service(tokenRepository, userRepository, encoder).saveNewPassword(
            "New-password1!",
            "New-password1!",
            "reset-token"
        );

        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(user.getUpdatedAt()).isNotNull();
        assertThat(token.isUsed()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }

    @Test
    void rejectsMismatchedPasswordsBeforeUsingToken() {
        ResetPasswordTokenRepository tokenRepository = mock(
            ResetPasswordTokenRepository.class
        );

        assertThatThrownBy(() -> service(
            tokenRepository,
            mock(UserRepository.class),
            mock(PasswordEncoder.class)
        ).saveNewPassword("New-password1!", "Different-password1!", "reset-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("The new passwords do not match");

        verify(tokenRepository, never()).findByTokenForUpdate(anyString());
    }

    @Test
    void rejectsUsedTokenWithoutChangingPassword() {
        ResetPasswordTokenRepository tokenRepository = mock(
            ResetPasswordTokenRepository.class
        );
        UserRepository userRepository = mock(UserRepository.class);
        ResetPasswordToken token = validToken();
        token.setUsed(true);
        when(tokenRepository.findByTokenForUpdate(anyString()))
            .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service(
            tokenRepository,
            userRepository,
            mock(PasswordEncoder.class)
        ).saveNewPassword("New-password1!", "New-password1!", "reset-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Password reset token is expired or already used");

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private ResetPasswordTokenService service(
        ResetPasswordTokenRepository tokenRepository,
        UserRepository userRepository,
        PasswordEncoder encoder
    ) {
        return new ResetPasswordTokenService(
            tokenRepository,
            userRepository,
            encoder,
            Duration.ofMinutes(30),
            mock(EmailService.class),
            "http://localhost:5173"
        );
    }

    private ResetPasswordToken validToken() {
        ResetPasswordToken token = new ResetPasswordToken();
        token.setToken("reset-token");
        token.setUserId(42L);
        token.setExpiresAt(Instant.now().plusSeconds(300));
        token.setUsed(false);
        return token;
    }
}
