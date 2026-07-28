package com.koino.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import com.koino.backend.model.User;

@Service
public class GoogleIdentityService {
    private final UserService userService;
    private final JwtDecoder decoder;
    private final String clientId;

    public GoogleIdentityService(
        UserService userService,
        @Value("${app.google.client-id}") String clientId
    ) {
        this.userService = userService;
        this.clientId = clientId;
        NimbusJwtDecoder googleDecoder = NimbusJwtDecoder.withJwkSetUri(
            "https://www.googleapis.com/oauth2/v3/certs"
        ).build();
        googleDecoder.setJwtValidator(
            JwtValidators.createDefaultWithIssuer("https://accounts.google.com")
        );
        this.decoder = googleDecoder;
    }

    public User authenticate(String credential) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("Google sign-in is unavailable");
        }
        try {
            Jwt jwt = decoder.decode(credential);
            List<String> audience = jwt.getAudience();
            Boolean verified = jwt.getClaim("email_verified");
            String email = jwt.getClaimAsString("email");
            if (!audience.contains(clientId)
                || !Boolean.TRUE.equals(verified)
                || email == null
                || email.isBlank()) {
                throw new IllegalArgumentException(
                    "Google could not verify this account"
                );
            }
            return userService.loginGoogleUser(
                email,
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("picture")
            );
        } catch (JwtException exception) {
            throw new IllegalArgumentException(
                "Google sign-in could not be verified"
            );
        }
    }

    public String getClientId() {
        return clientId;
    }
}
