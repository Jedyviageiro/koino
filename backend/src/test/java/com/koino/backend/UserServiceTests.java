package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.koino.backend.model.User;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.UserService;

class UserServiceTests {

    @Test
    void deactivatesActiveUser() {
        UserRepository repository = mock(UserRepository.class);
        User user = user(42L, true);
        when(repository.findById(42L)).thenReturn(Optional.of(user));

        service(repository).deactivateUser(42L);

        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeactivatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isEqualTo(user.getDeactivatedAt());
        verify(repository).save(user);
    }

    @Test
    void deactivationIsIdempotent() {
        UserRepository repository = mock(UserRepository.class);
        User user = user(42L, false);
        when(repository.findById(42L)).thenReturn(Optional.of(user));

        service(repository).deactivateUser(42L);

        verify(repository, never()).save(user);
    }

    @Test
    void rejectsLoginForDeactivatedUser() {
        UserRepository repository = mock(UserRepository.class);
        User user = user(42L, false);
        user.setEmail("reader@koino.local");
        when(repository.findByEmail(user.getEmail())).thenReturn(user);

        assertThatThrownBy(() -> service(repository).loginUser(user.getEmail(), "password"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid email or password");
    }

    @Test
    void rejectsUnknownUserDeactivation() {
        UserRepository repository = mock(UserRepository.class);
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service(repository).deactivateUser(404L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("No user found");
    }

    private UserService service(UserRepository repository) {
        return new UserService(mock(PasswordEncoder.class), repository);
    }

    private User user(Long id, boolean active) {
        User user = new User();
        user.setUserId(id);
        user.setActive(active);
        return user;
    }
}
