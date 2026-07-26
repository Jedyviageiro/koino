package com.koino.backend.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
    name = "user_task_devotionals",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_task_devotional_task",
        columnNames = "task_id"
    )
)
public class UserTaskDevotional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long devotionalId;

    @OneToOne
    @JoinColumn(name = "task_id", nullable = false)
    private UserPlanTask task;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String anchorVerseReference;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String anchorVerseText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String opening;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reflection;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String application;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prayer;

    @Column(nullable = false)
    private String modelName;

    @Column(nullable = false)
    private Instant generatedAt;
}
