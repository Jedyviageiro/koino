package com.koino.backend.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "battle_challenges")
public class BattleChallenge {
    @Id
    @Column(length = 36)
    private String challengeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenger_id", nullable = false)
    private User challenger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleChallengeStatus status;

    @Column(length = 36)
    private String challengerBattleId;

    @Column(length = 36)
    private String addresseeBattleId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant challengerLastSeenAt;
    private Instant addresseeLastSeenAt;
    private Instant respondedAt;

    @PrePersist
    void initialize() {
        if (challengeId == null) {
            challengeId = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
