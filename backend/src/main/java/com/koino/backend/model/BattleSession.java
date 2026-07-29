package com.koino.backend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "battle_sessions")
public class BattleSession {
    @Id
    @Column(length = 36)
    private String battleId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BattleStatus status;

    @Column(nullable = false, length = 120)
    private String opponentName;

    @Column(nullable = false)
    private int opponentElo;

    @Column(nullable = false)
    private int playerEloBefore;

    @Column(nullable = false)
    private int playerScore;

    @Column(nullable = false)
    private int opponentScore;

    private Integer opponentAttempts = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private BattleOpponentType opponentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opponent_user_id")
    private User opponentUser;

    @Column(length = 36)
    private String pairedBattleId;

    @Column(nullable = false)
    private int currentQuestionIndex;

    @Column(nullable = false)
    private int correctAnswers;

    @Column(nullable = false)
    private int ratingChange;

    @Column(nullable = false)
    private int playerEloAfter;

    @Column(nullable = false)
    private Instant startedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant completedAt;

    @OneToMany(
        mappedBy = "battle",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @OrderBy("position ASC")
    private List<BattleSessionQuestion> questions = new ArrayList<>();

    @PrePersist
    void initializeId() {
        if (battleId == null) {
            battleId = UUID.randomUUID().toString();
        }
        if (opponentType == null) {
            opponentType = BattleOpponentType.BOT;
        }
    }
}
