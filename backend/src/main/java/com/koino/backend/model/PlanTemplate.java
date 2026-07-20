package com.koino.backend.model;

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
    private Integer planId;
    private String name;
    private String description;
    private String targeTag; 
}
