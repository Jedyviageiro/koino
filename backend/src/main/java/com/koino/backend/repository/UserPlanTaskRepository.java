package com.koino.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.koino.backend.model.UserPlanTask;

@Repository
public interface UserPlanTaskRepository extends JpaRepository<UserPlanTask, Long> {

    List<UserPlanTask> findByActivePlanActivePlanIdOrderByDayNumber(Long activePlanId);

    List<UserPlanTask> findByActivePlanActivePlanIdAndActivePlanUserUserIdOrderByDayNumber(
        Long activePlanId,
        Long userId
    );
}
