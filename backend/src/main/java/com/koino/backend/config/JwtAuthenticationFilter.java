package com.koino.backend.config;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.koino.backend.model.User;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.JwtService;
import com.koino.backend.service.TrustSafetyService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final TrustSafetyService trustSafetyService;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository, TrustSafetyService trustSafetyService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.trustSafetyService = trustSafetyService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(BEARER_PREFIX.length());
        try {
            String email = jwtService.extractEmail(token);
            User user = userRepository.findByEmail(email);
            String restriction = user == null ? null : trustSafetyService.accessRestriction(user);
            if (restriction != null) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":403,\"errorCode\":\"ACCOUNT_RESTRICTED\",\"message\":\"" + restriction.replace("\"", "\\\"") + "\"}");
                return;
            }
            if (user != null
                && user.isActive()
                && SecurityContextHolder.getContext().getAuthentication() == null
                && jwtService.isValid(token, user)) {
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, java.util.List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (RuntimeException exception) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
