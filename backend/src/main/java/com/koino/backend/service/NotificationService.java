package com.koino.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.user.NotificationResponse;
import com.koino.backend.model.User;
import com.koino.backend.model.UserNotification;
import com.koino.backend.repository.UserNotificationRepository;

@Service
public class NotificationService {
    private final UserNotificationRepository notificationRepository;

    public NotificationService(UserNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public UserNotification createPlanReady(User user, String planName) {
        UserNotification notification = new UserNotification();
        notification.setUser(user);
        notification.setTitle("Your new plan is ready");
        notification.setMessage(
            planName + " is now available. Your first reading is waiting for you."
        );
        notification.setType("PLAN_READY");
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        UserNotification notification = notificationRepository
            .findByNotificationIdAndUserUserId(notificationId, userId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Notification not found"
            ));
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    private NotificationResponse toResponse(UserNotification notification) {
        return new NotificationResponse(
            notification.getNotificationId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getType(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}
