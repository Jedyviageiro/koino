package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.koino.backend.model.UserActivePlan;

@Repository
public interface UserActivePlanRepositor extends JpaRepository<UserActivePlan, Long> {

    boolean existsByUserUserIdAndPlanTemplatePlanCode(Long userId, String planCode);

    Optional<UserActivePlan> findTopByUserUserIdAndPlanTemplatePlanCodeOrderByPlanSequenceNumberDesc(
        Long userId,
        String planCode
    );

    List<UserActivePlan> findByUserUserIdOrderByPlanSequenceNumberAsc(Long userId);
}
