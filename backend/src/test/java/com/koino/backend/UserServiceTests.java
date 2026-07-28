package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.List;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.koino.backend.model.User;
import com.koino.backend.model.UserLoginDay;
import com.koino.backend.repository.UserLoginDayRepository;
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

    @Test
    void checksEmailExistenceUsingNormalizedInput() {
        UserRepository repository = mock(UserRepository.class);
        when(repository.existsByEmail("reader@koino.local")).thenReturn(true);

        boolean exists = service(repository).emailExists("  READER@KOINO.LOCAL ");

        assertThat(exists).isTrue();
        verify(repository).existsByEmail("reader@koino.local");
    }

    @Test
    void incrementsStreakOnlyAfterSuccessfulLoginOnANewDay() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User user = user(42L, true);
        user.setEmail("reader@koino.local");
        user.setPassword("encoded");
        user.setCurrentStreak(4);
        user.setLongestStreak(8);
        user.setLastLoginDate(LocalDate.now().minusDays(1));
        when(repository.findByEmail(user.getEmail())).thenReturn(user);
        when(encoder.matches("password", "encoded")).thenReturn(true);

        service(repository, encoder).loginUser(user.getEmail(), "password");

        assertThat(user.getCurrentStreak()).isEqualTo(5);
        assertThat(user.getLongestStreak()).isEqualTo(8);
        assertThat(user.getLastLoginDate()).isEqualTo(LocalDate.now());
        verify(repository).save(user);
    }

    @Test
    void resetsStreakAfterMissingADay() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User user = user(42L, true);
        user.setEmail("reader@koino.local");
        user.setPassword("encoded");
        user.setCurrentStreak(12);
        user.setLongestStreak(12);
        user.setLastLoginDate(LocalDate.now().minusDays(2));
        when(repository.findByEmail(user.getEmail())).thenReturn(user);
        when(encoder.matches("password", "encoded")).thenReturn(true);

        service(repository, encoder).loginUser(user.getEmail(), "password");

        assertThat(user.getCurrentStreak()).isEqualTo(1);
        assertThat(user.getLongestStreak()).isEqualTo(12);
    }

    @Test
    void recordsTheFirstAuthenticatedAppDayWhenStreakIsRequested() {
        UserRepository repository = mock(UserRepository.class);
        User user = user(42L, true);
        when(repository.findById(42L)).thenReturn(Optional.of(user));

        var streak = service(repository).getStreak(42L);

        assertThat(streak.currentStreak()).isEqualTo(1);
        assertThat(streak.longestStreak()).isEqualTo(1);
        assertThat(streak.lastLoginDate()).isEqualTo(LocalDate.now());
        verify(repository).save(user);
    }

    @Test
    void doesNotCountTheSameAuthenticatedDayTwice() {
        UserRepository repository = mock(UserRepository.class);
        User user = user(42L, true);
        user.setCurrentStreak(3);
        user.setLongestStreak(5);
        user.setLastLoginDate(LocalDate.now());
        when(repository.findById(42L)).thenReturn(Optional.of(user));

        var streak = service(repository).getStreak(42L);

        assertThat(streak.currentStreak()).isEqualTo(3);
        assertThat(streak.longestStreak()).isEqualTo(5);
        verify(repository, never()).save(user);
    }

    @Test
    void returnsRealRecentLoginDatesForTheStreakGraphic() {
        UserRepository repository = mock(UserRepository.class);
        UserLoginDayRepository loginDays = mock(UserLoginDayRepository.class);
        User user = user(42L, true);
        user.setCurrentStreak(2);
        user.setLongestStreak(4);
        user.setLastLoginDate(LocalDate.now());
        when(repository.findById(42L)).thenReturn(Optional.of(user));
        when(loginDays.existsByUserUserIdAndLoginDate(
            42L,
            LocalDate.now()
        )).thenReturn(true);
        when(loginDays.existsByUserUserIdAndLoginDate(
            42L,
            LocalDate.now().minusDays(1)
        )).thenReturn(true);
        when(loginDays
            .findByUserUserIdAndLoginDateBetweenOrderByLoginDateAsc(
                42L,
                LocalDate.now().minusDays(6),
                LocalDate.now()
            ))
            .thenReturn(List.of(
                loginDay(user, LocalDate.now().minusDays(1)),
                loginDay(user, LocalDate.now())
            ));

        var streak = new UserService(
            mock(PasswordEncoder.class),
            repository,
            loginDays
        ).getStreak(42L);

        assertThat(streak.recentDays()).hasSize(7);
        assertThat(streak.recentDays())
            .filteredOn(day -> day.active())
            .extracting(day -> day.date())
            .containsExactly(
                LocalDate.now().minusDays(1),
                LocalDate.now()
            );
    }

    private UserService service(UserRepository repository) {
        return service(repository, mock(PasswordEncoder.class));
    }

    private UserService service(
        UserRepository repository,
        PasswordEncoder encoder
    ) {
        return new UserService(
            encoder,
            repository,
            mock(UserLoginDayRepository.class)
        );
    }

    private UserLoginDay loginDay(User user, LocalDate date) {
        UserLoginDay loginDay = new UserLoginDay();
        loginDay.setUser(user);
        loginDay.setLoginDate(date);
        return loginDay;
    }

    private User user(Long id, boolean active) {
        User user = new User();
        user.setUserId(id);
        user.setActive(active);
        return user;
    }
}
