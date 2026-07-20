package com.koino.backend.model;

import jakarta.persistence.Entity;

import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "plan_templates")
public class PlanTemplate {
    private Integer planId;
    private String name;
    private String description;
    private String targeTag; 
}
