package com.koino.backend.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.user.OnboardingRequest;
import com.koino.backend.dto.user.UserProfileUpdateResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.UserProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {
    private final UserProfileService userProfileService;

    public OnboardingController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @PostMapping
    public ResponseEntity<UserProfileUpdateResponse> completeOnboarding(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody OnboardingRequest request
    ) {
        UserProfileUpdateResponse response = userProfileService.saveOnboardingPreference(
            user.getUserId(),
            request
        );
        return ResponseEntity.created(URI.create("/api/onboarding")).body(response);
    }

    @GetMapping
    public UserProfileUpdateResponse getOnboarding(@AuthenticationPrincipal User user) {
        return userProfileService.getProfile(user.getUserId());
    }
}
