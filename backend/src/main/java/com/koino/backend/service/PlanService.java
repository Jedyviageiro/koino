package com.koino.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.koino.backend.dto.plan.PlanTemplateDTO;
import com.koino.backend.dto.plan.UserActivePlanResponse;
import com.koino.backend.dto.plan.UserPlanTaskResponse;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanTask;

import com.koino.backend.repository.PlanTemplateRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserPlanTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanService {
    private final PlanTemplateRepository planTemplateRepository;
    private final UserActivePlanRepositor activePlanRepository;
    private final UserPlanTaskRepository taskRepository;

    public PlanService(
        PlanTemplateRepository planTemplateRepository,
        UserActivePlanRepositor activePlanRepository,
        UserPlanTaskRepository taskRepository
    ) {
        this.planTemplateRepository = planTemplateRepository;
        this.activePlanRepository = activePlanRepository;
        this.taskRepository = taskRepository;
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

    @Transactional(readOnly = true)
    public List<UserActivePlanResponse> getUserPlans(Long userId) {
        return activePlanRepository.findByUserUserIdOrderByPlanSequenceNumberAsc(userId)
            .stream()
            .map(this::toActivePlanResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<UserActivePlanResponse> getCurrentPlan(Long userId) {
        return activePlanRepository.findByUserUserIdOrderByPlanSequenceNumberAsc(userId)
            .stream()
            .filter(plan -> !plan.isCompleted())
            .findFirst()
            .map(this::toActivePlanResponse);
    }

    @Transactional(readOnly = true)
    public List<UserPlanTaskResponse> getPlanTasks(Long userId, Long activePlanId) {
        return taskRepository
            .findByActivePlanActivePlanIdAndActivePlanUserUserIdOrderByDayNumber(
                activePlanId,
                userId
            )
            .stream()
            .map(this::toTaskResponse)
            .toList();
    }

    private UserActivePlanResponse toActivePlanResponse(UserActivePlan activePlan) {
        List<UserPlanTask> tasks = taskRepository
            .findByActivePlanActivePlanIdOrderByDayNumber(activePlan.getActivePlanId());
        int completedDays = (int) tasks.stream().filter(UserPlanTask::isCompleted).count();
        int totalDays = tasks.size();
        double percentage = totalDays == 0 ? 0 : completedDays * 100.0 / totalDays;

        return new UserActivePlanResponse(
            activePlan.getActivePlanId(),
            activePlan.getPlanTemplate().getPlanCode(),
            activePlan.getPlanTemplate().getName(),
            activePlan.getPlanSequenceNumber(),
            activePlan.getStartDate(),
            tasks.isEmpty() ? activePlan.getStartDate() : tasks.getLast().getScheduledDate(),
            activePlan.getPlanTemplate().getEstimatedMinutesPerDay(),
            completedDays,
            totalDays,
            percentage,
            activePlan.isCompleted()
        );
    }

    private UserPlanTaskResponse toTaskResponse(UserPlanTask task) {
        return new UserPlanTaskResponse(
            task.getTaskId(),
            task.getDayNumber(),
            task.getScheduledDate(),
            task.getReadingAssignment(),
            task.isCompleted()
        );
    }
}

