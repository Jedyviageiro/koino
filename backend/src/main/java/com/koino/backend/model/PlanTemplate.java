package com.koino.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import lombok.Data;
import jakarta.persistence.Id;

@Entity
@Data
@Table(name = "plan_templates")
public class PlanTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planTemplateId;

    @Column(unique = true, length = 3)
    private String planCode;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;

    private String difficulty;

    @Column(nullable = false)
    private Integer durationDays;

    @Column(nullable = false)
    private Integer totalChapters;

    @Column(nullable = false)
    private String bookNames;

    @Column(nullable = false)
    private Integer estimatedMinutesPerDay;
    
    private String targetTag;
}
