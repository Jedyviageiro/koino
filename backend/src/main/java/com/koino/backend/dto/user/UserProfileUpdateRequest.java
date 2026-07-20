package com.koino.backend.dto.user;

public record UserProfileUpdateRequest(String journeyDescription,
    String preferredStartingPoint,
    String dailyRhythm,
    String workPace,
    Integer dailyCapacityMinutes) {
    
}
