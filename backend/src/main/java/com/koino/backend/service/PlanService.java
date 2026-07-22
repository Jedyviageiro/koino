package com.koino.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import com.koino.backend.dto.plan.PlanTemplateDTO;

import com.koino.backend.repository.PlanTemplateRepository;
import org.springframework.stereotype.Service;

@Service
public class PlanService {
    private final PlanTemplateRepository planTemplateRepository;

    public PlanService(PlanTemplateRepository planTemplateRepository){
        this.planTemplateRepository = planTemplateRepository;

    }

    public List<PlanTemplateDTO> getAllAvailablePlans(){
        return planTemplateRepository.findAll().stream()
            .map(plan -> new PlanTemplateDTO(
                plan.getPlanTemplateId(),
                plan.getPlanCode(),
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

    
}

