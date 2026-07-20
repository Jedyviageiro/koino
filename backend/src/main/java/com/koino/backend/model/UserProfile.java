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

    private String faithLevel;
    private String readingRhythm;
    private String workPace;
    private Integer dailyCapacityMinutes;
    
}
