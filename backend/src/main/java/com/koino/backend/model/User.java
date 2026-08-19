package com.koino.backend.model;


import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;


@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String password;

    @Column(nullable = false, unique = true)
    private String fullname;

    @Column(unique = true, length = 40)
    private String username;

    @Column(unique = true, length = 9)
    private String friendCode;

    @CreatedDate
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean active = true;

    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean emailVerified = true;

    private LocalDateTime deactivatedAt;

    @Column(length = 2048)
    private String profilePictureUrl;

    private String profilePicturePublicId;

    @Column(nullable = false, length = 64)
    @ColumnDefault("'Africa/Maputo'")
    private String timeZone = "Africa/Maputo";

    @Column(nullable = false, length = 10)
    @ColumnDefault("'en'")
    private String language = "en";

    @Column(nullable = false)
    @ColumnDefault("0")
    private int currentStreak;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int longestStreak;

    private LocalDate lastLoginDate;

    private Instant lastSeenAt;
}
