package com.koino.backend.dto.user;

public record OnboardingRequest
(String journeyDescription, String preferredStartingPoint, String dailyRhythm, String  workPace, Integer dailyCapacityMinutes) {
    
}
