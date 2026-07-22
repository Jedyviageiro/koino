package com.koino.backend.service;

import com.koino.backend.dto.user.OnboardingRequest;
import com.koino.backend.dto.user.UserProfileUpdateResponse;
import com.koino.backend.model.User;
import com.koino.backend.model.UserProfile;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final PlanGenerationService planGenerationService;

    public UserProfileService(
        UserProfileRepository userProfileRepository,
        UserRepository userRepository,
        PlanGenerationService planGenerationService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.planGenerationService = planGenerationService;
    }

    @Transactional
    public UserProfileUpdateResponse saveOnboardingPreference(
        Long userId,
        OnboardingRequest request
    ) {
        if(userProfileRepository.existsByUserUserId(userId)){
            throw new IllegalArgumentException("The user has already set his preference");
        }

        User user = userRepository.findById(userId) 
        .orElseThrow(() -> new IllegalArgumentException("User not found with Id " + userId));

        UserProfile userProfile = new UserProfile();

        userProfile.setUser(user);
        userProfile.setJourneyDescription(request.journeyDescription());
        userProfile.setPreferredStartingPoint(request.preferredStartingPoint());
        userProfile.setDailyRhythm(request.dailyRhythm());
        userProfile.setWorkPace(request.workPace());
        userProfile.setDailyCapacityMinutes(request.dailyCapacityMinutes());

        userProfileRepository.save(userProfile);
        planGenerationService.generateInitialPlan(
            userId,
            request.journeyDescription(),
            request.preferredStartingPoint(),
            request.dailyCapacityMinutes(),
            request.workPace()
        );
        return toResponse(userProfile);
    }

    @Transactional(readOnly = true)
    public UserProfileUpdateResponse getProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException(
                "The user has not completed onboarding"
            ));
        return toResponse(profile);
    }

    private UserProfileUpdateResponse toResponse(UserProfile profile) {
        return new UserProfileUpdateResponse(
            profile.getJourneyDescription(),
            profile.getPreferredStartingPoint(),
            profile.getDailyRhythm(),
            profile.getWorkPace(),
            profile.getDailyCapacityMinutes()
        );
    }
}
