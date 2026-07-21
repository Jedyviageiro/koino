package com.koino.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import com.koino.backend.dto.plan.PlanTemplateDTO;
import com.koino.backend.model.PlanTemplate;
import com.koino.backend.model.User;
import com.koino.backend.repository.PlanTemplateRepository;
import com.koino.backend.repository.UserRepository;


public class PlanService {
    private final PlanTemplateRepository planTemplateRepository;

    public PlanService(PlanTemplateRepository planTemplateRepository){
        this.planTemplateRepository = planTemplateRepository;

    }

    public List<PlanTemplateDTO> getAllAvailablePlans(){
        return planTemplateRepository.findAll().stream()
            .map(plan -> new PlanTemplateDTO(
                plan.getPlanTemplateId(),
                plan.getName(),
                plan.getDescription(),
                plan.getDifficulty(),
                plan.getDurationDays(),
                plan.getTotalChapters(),
                plan.getBookNames(),
                plan.getEstimatedMinutesPerDay()
            ))
            .collect(Collectors.toList());
    }

    public void generateUserPlan(Long userId, Long planTemplateId) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        PlanTemplate template = planTemplateRepository.findById(planTemplateId)
                .orElseThrow(() -> new IllegalArgumentException("Plan template not found with ID: " + planTemplateId));

        boolean hasExistingPlan = userPlanRepository.existsByUserId(userId);
        if (hasExistingPlan) {
            throw new IllegalStateException("You already have an active reading plan!");
        }

        // 4. >>> YOUR PLAN GENERATION ALGORITHM GOES HERE <<<
        // Now that you have the valid 'user' and 'template', you can write 
        // the math/logic to split total chapters across target dates!
    }
}

