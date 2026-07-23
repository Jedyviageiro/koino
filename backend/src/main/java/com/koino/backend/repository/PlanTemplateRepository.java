package com.koino.backend.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.koino.backend.model.PlanTemplate;

@Repository
public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, Long> {

    Optional<PlanTemplate> findByPlanCode(String planCode);

    Optional<PlanTemplate> findByName(String name);

    List<PlanTemplate> findAllByOrderByPlanCodeAsc();
}
