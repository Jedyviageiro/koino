package com.koino.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koino.backend.model.UserTaskDevotional;

public interface UserTaskDevotionalRepository
    extends JpaRepository<UserTaskDevotional, Long> {

    Optional<UserTaskDevotional> findByTaskTaskIdAndTaskActivePlanUserUserId(
        Long taskId,
        Long userId
    );

    Optional<UserTaskDevotional>
        findFirstByTaskReadingAssignmentAndLanguageOrderByDevotionalIdAsc(
            String readingAssignment,
            String language
        );

    boolean existsByTaskTaskId(Long taskId);
}
