package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.koino.backend.model.UserPlanTask;
import jakarta.persistence.LockModeType;

@Repository
public interface UserPlanTaskRepository extends JpaRepository<UserPlanTask, Long> {

    List<UserPlanTask> findByActivePlanActivePlanIdOrderByDayNumber(Long activePlanId);

    List<UserPlanTask> findByActivePlanActivePlanIdAndActivePlanUserUserIdOrderByDayNumber(
        Long activePlanId,
        Long userId
    );

    Optional<UserPlanTask> findByTaskIdAndActivePlanUserUserId(Long taskId, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select task
        from UserPlanTask task
        where task.taskId = :taskId
          and task.activePlan.user.userId = :userId
        """)
    Optional<UserPlanTask> findOwnedTaskForDevotional(
        @Param("taskId") Long taskId,
        @Param("userId") Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from UserPlanTask task where task.taskId = :taskId")
    Optional<UserPlanTask> findTaskForDevotional(
        @Param("taskId") Long taskId
    );

    @Query("""
        select task.taskId
        from UserPlanTask task
        where not exists (
            select devotional.devotionalId
            from UserTaskDevotional devotional
            where devotional.task = task
        )
          and task.scheduledDate <= :latestDate
        order by task.taskId
        """)
    List<Long> findTaskIdsWithoutDevotional(
        @Param("latestDate") LocalDate latestDate,
        Pageable pageable
    );

    boolean existsByActivePlanActivePlanIdAndIsCompletedFalse(Long activePlanId);

    @Query("""
        select task
        from UserPlanTask task
        where task.isCompleted = false
          and task.activePlan.isCompleted = false
          and task.activePlan.user.active = true
          and task.dayNumber = (
              select min(candidate.dayNumber)
              from UserPlanTask candidate
              where candidate.activePlan = task.activePlan
                and candidate.isCompleted = false
          )
        """)
    List<UserPlanTask> findCurrentIncompleteTasksForReminders();
}
