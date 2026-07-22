package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.PlanGenerationService;

@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
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

    @Test
    void generatesInitialPlanWithRealAssignmentsWithoutDuplicates() {
        User user = new User();
        user.setEmail("plan-generation-test@koino.local");
        user.setPassword("not-used-in-this-test");
        user.setFullname("Plan Generation Test");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        planGenerationService.generateInitialPlan(
            user.getUserId(),
            "NEW_TO_FAITH",
            "GOSPELS",
            20,
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
        assertThat(tasks).hasSize(37);
        assertThat(tasks.getFirst().getReadingAssignment()).startsWith("Mark 1:");
        assertThat(tasks.getLast().getReadingAssignment()).endsWith("; 21");
        assertThat(tasks).allSatisfy(task -> {
            assertThat(task.getReadingAssignment()).isNotBlank();
            assertThat(task.getScheduledDate()).isNotNull();
        });

        planGenerationService.generateInitialPlan(
            user.getUserId(),
            "NEW_TO_FAITH",
            "GOSPELS",
            20,
            "STEADY_NINE_TO_FIVE"
        );

        assertThat(taskRepository.findByActivePlanActivePlanIdOrderByDayNumber(
            activePlan.getActivePlanId()
        )).hasSize(37);
    }
}
