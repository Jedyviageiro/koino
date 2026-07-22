package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.koino.backend.config.SecurityConfig;

class CorsConfigurationTests {

    @Test
    void allowsConfiguredFrontendOriginsAndBearerHeaders() {
        UrlBasedCorsConfigurationSource source = new SecurityConfig()
            .corsConfigurationSource("http://localhost:5173, https://app.koino.com");
        MockHttpServletRequest request = new MockHttpServletRequest(
            "OPTIONS",
            "/api/onboarding"
        );

        CorsConfiguration configuration = source.getCorsConfiguration(request);

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOrigins()).containsExactly(
            "http://localhost:5173",
            "https://app.koino.com"
        );
        assertThat(configuration.getAllowedMethods()).contains("OPTIONS", "POST", "PATCH");
        assertThat(configuration.getAllowedHeaders()).contains("Authorization", "Content-Type");
        assertThat(configuration.getAllowCredentials()).isFalse();
    }
}
