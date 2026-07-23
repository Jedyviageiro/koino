package com.koino.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.plan.PlanTemplateDTO;
import com.koino.backend.dto.plan.UserActivePlanResponse;
import com.koino.backend.dto.plan.UserPlanProgressResponse;
import com.koino.backend.dto.plan.UserPlanTaskResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.PlanService;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public List<PlanTemplateDTO> getPlanTemplates() {
        return planService.getAllAvailablePlans();
    }

    @GetMapping("/me")
    public List<UserActivePlanResponse> getUserPlans(@AuthenticationPrincipal User user) {
        return planService.getUserPlans(user.getUserId());
    }

    @GetMapping("/me/current")
    public ResponseEntity<UserActivePlanResponse> getCurrentPlan(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.of(planService.getCurrentPlan(user.getUserId()));
    }

    @GetMapping("/me/today")
    public ResponseEntity<UserPlanTaskResponse> getTodayTask(
        @AuthenticationPrincipal User user
    ) {
        return planService.getTodayTask(user.getUserId())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/me/current/progress")
    public ResponseEntity<UserPlanProgressResponse> getCurrentProgress(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.of(planService.getCurrentProgress(user.getUserId()));
    }

    @GetMapping("/me/{activePlanId}/tasks")
    public List<UserPlanTaskResponse> getPlanTasks(
        @AuthenticationPrincipal User user,
        @PathVariable Long activePlanId
    ) {
        return planService.getPlanTasks(user.getUserId(), activePlanId);
    }

    @PatchMapping("/me/tasks/{taskId}/complete")
    public UserPlanTaskResponse completeTask(
        @AuthenticationPrincipal User user,
        @PathVariable Long taskId
    ) {
        return planService.completeTask(user.getUserId(), taskId);
    }
}
