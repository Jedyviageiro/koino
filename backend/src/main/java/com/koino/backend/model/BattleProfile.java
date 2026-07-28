package com.koino.backend.model;

import java.time.Instant;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "battle_profiles",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_battle_profile_user",
        columnNames = "user_id"
    )
)
public class BattleProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long battleProfileId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @ColumnDefault("200")
    private int elo = 200;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int battles;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int wins;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int losses;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int draws;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int winStreak;

    @Column(nullable = false)
    @ColumnDefault("0")
    private int bestWinStreak;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void initializeTimestamps() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
}
