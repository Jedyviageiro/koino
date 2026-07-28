package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.koino.backend.model.EmailVerificationToken;
import com.koino.backend.model.User;
import com.koino.backend.repository.EmailVerificationTokenRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.EmailVerificationService;
import com.koino.backend.service.GmailService.EmailService;

class EmailVerificationServiceTests {
    @Test
    void storesOnlyTokenHashAndEmailsRawToken() {
        EmailVerificationTokenRepository tokens = mock(
            EmailVerificationTokenRepository.class
        );
        UserRepository users = mock(UserRepository.class);
        EmailService email = mock(EmailService.class);
        User user = user(7L);
        when(tokens.findTopByUserIdOrderByCreatedAtDesc(7L))
            .thenReturn(Optional.empty());
        when(tokens.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service(tokens, users, email).sendVerification(user);

        ArgumentCaptor<EmailVerificationToken> tokenCaptor =
            ArgumentCaptor.forClass(EmailVerificationToken.class);
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(tokens).save(tokenCaptor.capture());
        verify(email).sendEmailVerification(
            eq(user),
            urlCaptor.capture(),
            eq(Duration.ofHours(24))
        );
        String storedHash = tokenCaptor.getValue().getTokenHash();
        String rawToken = urlCaptor.getValue().substring(
            urlCaptor.getValue().indexOf("token=") + 6
        );
        assertThat(storedHash).hasSize(64).doesNotContain(rawToken);
        assertThat(rawToken).hasSizeGreaterThan(32);
    }

    @Test
    void confirmationVerifiesUserAndConsumesToken() {
        EmailVerificationTokenRepository tokens = mock(
            EmailVerificationTokenRepository.class
        );
        UserRepository users = mock(UserRepository.class);
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUserId(7L);
        token.setExpiresAt(Instant.now().plusSeconds(300));
        User user = user(7L);
        when(tokens.findByTokenHash(any())).thenReturn(Optional.of(token));
        when(users.findById(7L)).thenReturn(Optional.of(user));

        service(tokens, users, mock(EmailService.class)).confirm("raw-token");

        assertThat(user.isEmailVerified()).isTrue();
        assertThat(token.isUsed()).isTrue();
        verify(users).save(user);
        verify(tokens).save(token);
    }

    private EmailVerificationService service(
        EmailVerificationTokenRepository tokens,
        UserRepository users,
        EmailService email
    ) {
        return new EmailVerificationService(
            tokens,
            users,
            email,
            Duration.ofHours(24),
            "http://localhost:5173"
        );
    }

    private User user(Long id) {
        User user = new User();
        user.setUserId(id);
        user.setEmail("member@example.com");
        user.setFullname("Koino Member");
        user.setActive(true);
        user.setEmailVerified(false);
        return user;
    }
}
