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
@Table(name = "battle_matchmaking_tickets")
public class BattleMatchmakingTicket {
    @Id
    @Column(length = 36)
    private String ticketId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleMatchmakingStatus status;

    @Column(length = 36)
    private String battleId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant heartbeatAt;

    private Instant matchedAt;

    @PrePersist
    void initialize() {
        if (ticketId == null) {
            ticketId = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (heartbeatAt == null) {
            heartbeatAt = createdAt;
        }
    }
}
