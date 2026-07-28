package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.koino.backend.model.UserNotification;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserNotification> findByNotificationIdAndUserUserId(
        Long notificationId,
        Long userId
    );
}
