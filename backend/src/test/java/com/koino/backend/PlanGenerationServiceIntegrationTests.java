package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.model.UserProfile;
import com.koino.backend.dto.plan.UserPlanProgressResponse;
import com.koino.backend.dto.plan.UserPlanTaskResponse;
import com.koino.backend.repository.PlanTemplateRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.PlanGenerationService;
import com.koino.backend.service.PlanService;

@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=update",
    "spring.jpa.show-sql=false"
})
@Transactional
class PlanGenerationServiceIntegrationTests {

    @Autowired
    private PlanGenerationService planGenerationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserActivePlanRepositor activePlanRepository;

    @Autowired
    private UserPlanTaskRepository taskRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PlanTemplateRepository planTemplateRepository;

    @Autowired
    private PlanService planService;

    @Test
    void catalogIsAvailableBeforeOnboarding() {
        assertThat(planTemplateRepository.findAllByOrderByPlanCodeAsc()).hasSize(18);
    }

    @Test
    void generatesInitialPlanWithRealAssignmentsWithoutDuplicates() {
        User user = new User();
        user.setEmail("plan-generation-test@koino.local");
        user.setPassword("not-used-in-this-test");
        user.setFullname("Plan Generation Test");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        Long userId = user.getUserId();

        planGenerationService.generateInitialPlan(
            userId,
            "NEW_TO_FAITH",
            "GOSPELS",
            10,
            "STEADY_NINE_TO_FIVE"
        );

        UserActivePlan activePlan = activePlanRepository
            .findTopByUserUserIdAndPlanTemplatePlanCodeOrderByPlanSequenceNumberDesc(
                user.getUserId(),
                "P01"
            )
            .orElseThrow();
        List<UserPlanTask> tasks = taskRepository
            .findByActivePlanActivePlanIdOrderByDayNumber(activePlan.getActivePlanId());

        assertThat(activePlan.getPlanSequenceNumber()).isEqualTo(1);
        assertThat(activePlan.getEstimatedMinutesPerDay()).isEqualTo(10);
        assertThat(tasks).hasSize(74);
        assertThat(tasks.getFirst().getReadingAssignment()).startsWith("Mark 1:");
        assertThat(tasks.getLast().getReadingAssignment()).isEqualTo("John 21:5-25");
        assertThat(tasks).allSatisfy(task -> {
            assertThat(task.getReadingAssignment()).isNotBlank();
            assertThat(task.getScheduledDate()).isNotNull();
            assertThat(task.getEstimatedMinutes()).isEqualTo(10);
            assertThat(task.getPassages()).isNotEmpty();
            assertThat(task.getPassages()).allSatisfy(passage -> {
                assertThat(passage.getChapter().getChapterId()).isNotNull();
                assertThat(passage.getFirstVerse()).isPositive();
                assertThat(passage.getLastVerse())
                    .isGreaterThanOrEqualTo(passage.getFirstVerse());
            });
        });

        planGenerationService.generateInitialPlan(
            user.getUserId(),
            "NEW_TO_FAITH",
            "GOSPELS",
            10,
            "STEADY_NINE_TO_FIVE"
        );

        assertThat(taskRepository.findByActivePlanActivePlanIdOrderByDayNumber(
            activePlan.getActivePlanId()
        )).hasSize(74);
    }

    @Test
    void completingCurrentPlanUnlocksOnlyTheNextPlan() {
        User user = new User();
        user.setEmail("plan-progression-test@koino.local");
        user.setPassword("not-used-in-this-test");
        user.setFullname("Plan Progression Test");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setJourneyDescription("NEW_TO_FAITH");
        profile.setPreferredStartingPoint("GOSPELS");
        profile.setDailyRhythm("MORNING");
        profile.setWorkPace("STEADY_NINE_TO_FIVE");
        profile.setDailyCapacityMinutes(20);
        userProfileRepository.save(profile);
        Long userId = user.getUserId();

        planGenerationService.generateInitialPlan(
            userId,
            profile.getJourneyDescription(),
            profile.getPreferredStartingPoint(),
            profile.getDailyCapacityMinutes(),
            profile.getWorkPace()
        );

        UserActivePlan firstPlan = activePlanRepository
            .findTopByUserUserIdAndPlanTemplatePlanCodeOrderByPlanSequenceNumberDesc(
                user.getUserId(),
                "P01"
            )
            .orElseThrow();
        List<UserPlanTask> firstPlanTasks = taskRepository
            .findByActivePlanActivePlanIdOrderByDayNumber(firstPlan.getActivePlanId());
        firstPlanTasks.forEach(task -> task.setScheduledDate(LocalDate.now()));
        taskRepository.saveAll(firstPlanTasks);

        firstPlanTasks.forEach(task ->
            planService.completeTask(userId, task.getTaskId())
        );

        List<UserActivePlan> plans = activePlanRepository
            .findByUserUserIdOrderByPlanSequenceNumberAsc(userId);
        assertThat(plans).hasSize(2);
        assertThat(plans.getFirst().isCompleted()).isTrue();
        assertThat(plans.getFirst().getPlanTemplate().getPlanCode()).isEqualTo("P01");
        assertThat(plans.getLast().isCompleted()).isFalse();
        assertThat(plans.getLast().getPlanTemplate().getPlanCode()).isEqualTo("P02");
    }

    @Test
    void exposesTodayReadingAndTracksSequentialProgress() {
        User user = new User();
        user.setEmail("plan-progress-test@koino.local");
        user.setPassword("not-used-in-this-test");
        user.setFullname("Plan Progress Test");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        Long userId = user.getUserId();

        planGenerationService.generateInitialPlan(
            userId,
            "NEW_TO_FAITH",
            "GOSPELS",
            20,
            "STEADY_NINE_TO_FIVE"
        );

        UserActivePlan activePlan = activePlanRepository
            .findTopByUserUserIdAndPlanTemplatePlanCodeOrderByPlanSequenceNumberDesc(
                userId,
                "P01"
            )
            .orElseThrow();
        List<UserPlanTask> tasks = taskRepository
            .findByActivePlanActivePlanIdOrderByDayNumber(activePlan.getActivePlanId());
        UserPlanTask firstTask = tasks.getFirst();
        UserPlanTask secondTask = tasks.get(1);

        UserPlanTaskResponse today = planService.getTodayTask(userId).orElseThrow();
        assertThat(today.taskId()).isEqualTo(firstTask.getTaskId());
        assertThat(today.estimatedMinutes()).isEqualTo(20);
        assertThat(today.passages()).isNotEmpty();

        assertThatThrownBy(() ->
            planService.completeTask(userId, secondTask.getTaskId())
        )
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Readings must be completed in order");

        UserPlanTaskResponse completed = planService.completeTask(
            userId,
            firstTask.getTaskId()
        );
        assertThat(completed.completed()).isTrue();
        assertThat(completed.completedAt()).isNotNull();
        assertThat(planService.getTodayTask(userId)).isEmpty();

        assertThatThrownBy(() ->
            planService.completeTask(userId, secondTask.getTaskId())
        )
            .isInstanceOf(IllegalStateException.class)
            .hasMessageStartingWith("This reading is locked until");

        UserPlanProgressResponse progress = planService
            .getCurrentProgress(userId)
            .orElseThrow();
        assertThat(progress.plan().completedDays()).isEqualTo(1);
        assertThat(progress.plan().totalDays()).isEqualTo(37);
        assertThat(progress.plan().completionPercentage()).isGreaterThan(0);
        assertThat(progress.dailyProgress().getFirst().completed()).isTrue();
        assertThat(progress.dailyProgress().getFirst().completedAt()).isNotNull();
        assertThat(progress.dailyProgress().getFirst().cumulativeCompletedDays()).isEqualTo(1);
    }
}
