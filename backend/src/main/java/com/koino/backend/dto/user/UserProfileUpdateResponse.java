package com.koino.backend.dto.user;

public record UserProfileUpdateResponse(String journeyDescription,
    String preferredStartingPoint,
    String dailyRhythm,
    String workPace,
    Integer dailyCapacityMinutes) {
    
}
