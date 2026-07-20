package com.koino.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.PlanTemplate;

@Repository
public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, Integer> {
    
}
