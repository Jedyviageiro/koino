package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import com.koino.backend.config.JwtAuthenticationFilter;
import com.koino.backend.model.User;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.JwtService;

class JwtAuthenticationFilterTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesValidBearerToken() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        UserRepository userRepository = mock(UserRepository.class);
        User user = new User();
        user.setEmail("reader@koino.local");

        when(jwtService.extractEmail("valid-token")).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(user);
        when(jwtService.isValid("valid-token", user)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");

        filter(jwtService, userRepository).doFilter(
            request,
            new MockHttpServletResponse(),
            new MockFilterChain()
        );

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isSameAs(user);
    }

    @Test
    void leavesInvalidBearerTokenUnauthenticated() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        UserRepository userRepository = mock(UserRepository.class);
        when(jwtService.extractEmail("invalid-token"))
            .thenThrow(new IllegalArgumentException("invalid"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-token");

        filter(jwtService, userRepository).doFilter(
            request,
            new MockHttpServletResponse(),
            new MockFilterChain()
        );

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private JwtAuthenticationFilter filter(
        JwtService jwtService,
        UserRepository userRepository
    ) {
        return new JwtAuthenticationFilter(jwtService, userRepository);
    }
}
