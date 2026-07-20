package com.koino.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "user_profiles")
public class UserProfile {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;

    private String journeyDescription; // Screen 1: User's faith journey
    private String preferredStartingPoint; // Screen 2: Where they want to begin
    private String dailyRhythm; // Screen 3: Time of day for peace
    private String workPace; // Screen 4A: Typical work pace
    private Integer dailyCapacityMinutes; // Screen 4B: Time set aside for reading
    
}
