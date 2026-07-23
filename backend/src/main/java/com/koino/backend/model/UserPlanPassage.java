package com.koino.backend.model;

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
    name = "user_plan_passages",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_plan_passage_order",
        columnNames = {"task_id", "passage_order"}
    )
)
public class UserPlanPassage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long passageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private UserPlanTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false)
    private Integer firstVerse;

    @Column(nullable = false)
    private Integer lastVerse;

    @Column(nullable = false)
    private Integer passageOrder;
}
