package com.koino.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.koino.backend.model.UserNotification;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserNotification> findByNotificationIdAndUserUserId(
        Long notificationId,
        Long userId
    );

    @Modifying
    @Query("""
        update UserNotification notification
        set notification.read = true
        where notification.user.userId = :userId
          and notification.read = false
        """)
    int markAllRead(@Param("userId") Long userId);
}
