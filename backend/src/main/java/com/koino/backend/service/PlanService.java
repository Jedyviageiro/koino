package com.koino.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.koino.backend.dto.plan.PlanTemplateDTO;
import com.koino.backend.dto.plan.ReadingPassageResponse;
import com.koino.backend.dto.plan.UserActivePlanResponse;
import com.koino.backend.dto.plan.UserPlanProgressPointResponse;
import com.koino.backend.dto.plan.UserPlanProgressResponse;
import com.koino.backend.dto.plan.UserPlanTaskResponse;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanPassage;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.model.UserProfile;

import com.koino.backend.repository.PlanTemplateRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanService {
    private final PlanTemplateRepository planTemplateRepository;
    private final UserActivePlanRepositor activePlanRepository;
    private final UserPlanTaskRepository taskRepository;
    private final UserProfileRepository userProfileRepository;
    private final PlanGenerationService planGenerationService;

    public PlanService(
        PlanTemplateRepository planTemplateRepository,
        UserActivePlanRepositor activePlanRepository,
        UserPlanTaskRepository taskRepository,
        UserProfileRepository userProfileRepository,
        PlanGenerationService planGenerationService
    ) {
        this.planTemplateRepository = planTemplateRepository;
        this.activePlanRepository = activePlanRepository;
        this.taskRepository = taskRepository;
        this.userProfileRepository = userProfileRepository;
        this.planGenerationService = planGenerationService;
    }

    public List<PlanTemplateDTO> getAllAvailablePlans(){
        return planTemplateRepository.findAllByOrderByPlanCodeAsc().stream()
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
            .toList();
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
        return findCurrentPlan(userId).map(this::toActivePlanResponse);
    }

    @Transactional(readOnly = true)
    public Optional<UserPlanTaskResponse> getTodayTask(Long userId) {
        return findCurrentPlan(userId)
            .flatMap(plan -> firstIncompleteTask(plan.getActivePlanId()))
            .filter(task -> !task.getScheduledDate().isAfter(LocalDate.now()))
            .map(this::toTaskResponse);
    }

    @Transactional(readOnly = true)
    public Optional<UserPlanProgressResponse> getCurrentProgress(Long userId) {
        return findCurrentPlan(userId).map(plan -> {
            List<UserPlanTask> tasks = taskRepository
                .findByActivePlanActivePlanIdOrderByDayNumber(plan.getActivePlanId());
            int totalDays = tasks.size();
            int cumulativeCompleted = 0;
            List<UserPlanProgressPointResponse> dailyProgress =
                new java.util.ArrayList<>(totalDays);

            for (UserPlanTask task : tasks) {
                if (task.isCompleted()) {
                    cumulativeCompleted++;
                }
                double percentage = totalDays == 0
                    ? 0
                    : cumulativeCompleted * 100.0 / totalDays;
                dailyProgress.add(new UserPlanProgressPointResponse(
                    task.getTaskId(),
                    task.getDayNumber(),
                    task.getScheduledDate(),
                    task.isCompleted(),
                    task.getCompletedAt(),
                    cumulativeCompleted,
                    percentage
                ));
            }

            return new UserPlanProgressResponse(
                toActivePlanResponse(plan, tasks),
                List.copyOf(dailyProgress)
            );
        });
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

    @Transactional
    public UserPlanTaskResponse completeTask(Long userId, Long taskId) {
        UserPlanTask task = taskRepository
            .findByTaskIdAndActivePlanUserUserId(taskId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Plan task not found"));
        if (task.isCompleted()) {
            return toTaskResponse(task);
        }

        UserActivePlan activePlan = task.getActivePlan();

        UserActivePlan currentPlan = findCurrentPlan(userId)
            .orElseThrow(() -> new IllegalStateException("The user has no active plan"));

        if (!currentPlan.getActivePlanId().equals(activePlan.getActivePlanId())) {
            throw new IllegalStateException("Only tasks from the current plan can be completed");
        }

        UserPlanTask nextTask = firstIncompleteTask(activePlan.getActivePlanId())
            .orElseThrow(() -> new IllegalStateException("The plan has no incomplete reading"));
        if (!nextTask.getTaskId().equals(task.getTaskId())) {
            throw new IllegalStateException("Readings must be completed in order");
        }
        if (task.getScheduledDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException(
                "This reading is locked until " + task.getScheduledDate()
            );
        }

        task.setCompleted(true);
        task.setCompletedAt(Instant.now());
        task = taskRepository.save(task);

        if (!taskRepository.existsByActivePlanActivePlanIdAndIsCompletedFalse(
            activePlan.getActivePlanId()
        )) {
            activePlan.setCompleted(true);
            activePlanRepository.save(activePlan);

            UserProfile profile = userProfileRepository.findByUserUserId(userId)
                .orElseThrow(() -> new IllegalStateException(
                    "The user has not completed onboarding"
                ));
            planGenerationService.generateNextPlan(
                userId,
                profile.getJourneyDescription(),
                profile.getPreferredStartingPoint(),
                profile.getDailyCapacityMinutes(),
                profile.getWorkPace(),
                activePlan.getPlanTemplate().getPlanCode()
            );
        }

        return toTaskResponse(task);
    }

    private UserActivePlanResponse toActivePlanResponse(UserActivePlan activePlan) {
        List<UserPlanTask> tasks = taskRepository
            .findByActivePlanActivePlanIdOrderByDayNumber(activePlan.getActivePlanId());
        return toActivePlanResponse(activePlan, tasks);
    }

    private UserActivePlanResponse toActivePlanResponse(
        UserActivePlan activePlan,
        List<UserPlanTask> tasks
    ) {
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
            activePlan.getEstimatedMinutesPerDay(),
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
            task.getEstimatedMinutes(),
            task.isCompleted(),
            task.getCompletedAt(),
            task.getPassages().stream().map(this::toPassageResponse).toList()
        );
    }

    private ReadingPassageResponse toPassageResponse(UserPlanPassage passage) {
        return new ReadingPassageResponse(
            passage.getPassageId(),
            passage.getChapter().getChapterId(),
            passage.getChapter().getBook().getBookId(),
            passage.getChapter().getBook().getTitle(),
            passage.getChapter().getChapterNumber(),
            passage.getFirstVerse(),
            passage.getLastVerse()
        );
    }

    private Optional<UserActivePlan> findCurrentPlan(Long userId) {
        return activePlanRepository.findByUserUserIdOrderByPlanSequenceNumberAsc(userId)
            .stream()
            .filter(plan -> !plan.isCompleted())
            .findFirst();
    }

    private Optional<UserPlanTask> firstIncompleteTask(Long activePlanId) {
        return taskRepository.findByActivePlanActivePlanIdOrderByDayNumber(activePlanId)
            .stream()
            .filter(task -> !task.isCompleted())
            .findFirst();
    }
}

