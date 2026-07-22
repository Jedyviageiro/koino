package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import com.koino.backend.controller.OnboardingController;
import com.koino.backend.dto.user.OnboardingRequest;
import com.koino.backend.dto.user.UserProfileUpdateResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.UserProfileService;

class OnboardingControllerTests {

    @Test
    void completesOnboardingForAuthenticatedUser() {
        UserProfileService service = mock(UserProfileService.class);
        User user = new User();
        user.setUserId(42L);
        OnboardingRequest request = new OnboardingRequest(
            "NEW_TO_FAITH",
            "GOSPELS",
            "MORNING",
            "STEADY_NINE_TO_FIVE",
            20
        );
        UserProfileUpdateResponse expected = new UserProfileUpdateResponse(
            request.journeyDescription(),
            request.preferredStartingPoint(),
            request.dailyRhythm(),
            request.workPace(),
            request.dailyCapacityMinutes()
        );
        when(service.saveOnboardingPreference(42L, request)).thenReturn(expected);

        ResponseEntity<UserProfileUpdateResponse> response = new OnboardingController(service)
            .completeOnboarding(user, request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isEqualTo(expected);
        assertThat(response.getHeaders().getLocation().toString()).isEqualTo("/api/onboarding");
    }
}
