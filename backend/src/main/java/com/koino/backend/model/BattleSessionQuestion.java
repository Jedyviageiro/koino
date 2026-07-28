package com.koino.backend.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "battle_session_questions",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_battle_question_position",
        columnNames = {"battle_id", "position"}
    )
)
public class BattleSessionQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long battleQuestionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "battle_id", nullable = false)
    private BattleSession battle;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private BattleQuestion question;

    @Column(nullable = false)
    private int position;

    private Integer selectedOption;

    private Boolean correct;

    @Column(nullable = false)
    private int pointsAwarded;

    private Instant answeredAt;
}
