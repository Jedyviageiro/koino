package com.koino.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "battle_questions")
public class BattleQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @Column(nullable = false, unique = true, length = 120)
    private String catalogKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(nullable = false, length = 500)
    private String optionA;

    @Column(nullable = false, length = 500)
    private String optionB;

    @Column(nullable = false, length = 500)
    private String optionC;

    @Column(nullable = false, length = 500)
    private String optionD;

    @Column(nullable = false)
    private int correctOption;

    @Column(nullable = false)
    private int difficulty;

    @Column(nullable = false, length = 120)
    private String category;

    @Column(length = 120)
    private String reference;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String promptPt;

    @Column(length = 500)
    private String optionAPt;

    @Column(length = 500)
    private String optionBPt;

    @Column(length = 500)
    private String optionCPt;

    @Column(length = 500)
    private String optionDPt;

    @Column(length = 120)
    private String categoryPt;

    @Column(columnDefinition = "TEXT")
    private String explanationPt;

    @Column(nullable = false)
    private boolean locallyBackedUp;
}
