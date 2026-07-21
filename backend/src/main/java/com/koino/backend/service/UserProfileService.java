package com.koino.backend.service;

import com.koino.backend.dto.user.OnboardingRequest;
import com.koino.backend.model.User;
import com.koino.backend.model.UserProfile;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;

public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository,UserRepository userRepository){
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    public void saveOnboardingPreference(Long userId, OnboardingRequest request){
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

        userProfileRepository.save( userProfile);
        
    }

       public String getProfile( Long userId){       
            User user = userRepository.findById(userId)
            .orElseThrow(()-> new IllegalArgumentException("User not found with Id" + userId));

            return user.getFullname();
    }

}
