package com.koino.backend.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Entity
@Data
@Table(
    name = "user_plan_tasks",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_plan_task_day",
        columnNames = {"active_plan_id", "day_number"}
    )
)
public class UserPlanTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;

    @ManyToOne
    @JoinColumn(name = "active_plan_id", nullable = false)
    private UserActivePlan activePlan;

    @Column(nullable = false)
    private Integer dayNumber; // Day 1, Day 2, Day 3...
    @Column(nullable = false)
    private LocalDate scheduledDate; // The calendar date for this reading

    @Column(columnDefinition = "TEXT", nullable = false)
    private String readingAssignment; // e.g., "Mark 1-2"

    @Column(nullable = false)
    private Integer estimatedMinutes;

    private boolean isCompleted = false;
    private Instant completedAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("passageOrder ASC")
    private List<UserPlanPassage> passages = new ArrayList<>();
}
