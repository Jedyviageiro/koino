package com.koino.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.plan.PlanTemplateDTO;
import com.koino.backend.dto.plan.ReadingProgressRequest;
import com.koino.backend.dto.plan.UserActivePlanResponse;
import com.koino.backend.dto.plan.UserPlanProgressResponse;
import com.koino.backend.dto.plan.UserPlanTaskResponse;
import com.koino.backend.dto.plan.UserTaskDevotionalResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.DevotionalService;
import com.koino.backend.service.PlanService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private final PlanService planService;
    private final DevotionalService devotionalService;

    public PlanController(
        PlanService planService,
        DevotionalService devotionalService
    ) {
        this.planService = planService;
        this.devotionalService = devotionalService;
    }

    @GetMapping
    public List<PlanTemplateDTO> getPlanTemplates() {
        return planService.getAllAvailablePlans();
    }

    @GetMapping("/me")
    public List<UserActivePlanResponse> getUserPlans(@AuthenticationPrincipal User user) {
        return planService.getUserPlans(user.getUserId());
    }

    @GetMapping("/me/route")
    public List<PlanTemplateDTO> getUserPlanRoute(
        @AuthenticationPrincipal User user
    ) {
        return planService.getUserPlanRoute(user.getUserId());
    }

    @GetMapping("/me/current")
    public ResponseEntity<UserActivePlanResponse> getCurrentPlan(
        @AuthenticationPrincipal User user
    ) {
        return planService.getCurrentPlan(user.getUserId())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
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
        return planService.getCurrentProgress(user.getUserId())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
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

    @PatchMapping("/me/tasks/{taskId}/progress")
    public UserPlanTaskResponse updateReadingProgress(
        @AuthenticationPrincipal User user,
        @PathVariable Long taskId,
        @Valid @RequestBody ReadingProgressRequest request
    ) {
        return planService.updateReadingProgress(
            user.getUserId(),
            taskId,
            request.verseIndex()
        );
    }

    @GetMapping("/me/tasks/{taskId}/devotional")
    public UserTaskDevotionalResponse getTaskDevotional(
        @AuthenticationPrincipal User user,
        @PathVariable Long taskId
    ) {
        return devotionalService.getOrCreate(user.getUserId(), taskId);
    }
}
