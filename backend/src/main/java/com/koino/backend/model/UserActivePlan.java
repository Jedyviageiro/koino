package com.koino.backend.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "user_active_plans")
public class UserActivePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long activePlanId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "plan_id", nullable = false)
    private PlanTemplate planTemplate;

    private Integer planSequenceNumber;
    private LocalDate startDate;
    private boolean isCompleted = false; // Tracks if the whole plan is finished
}
