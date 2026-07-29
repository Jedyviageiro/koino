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
        return create(
            user,
            "Your new plan is ready",
            planName
                + " is now available. Your first reading is waiting for you.",
            "PLAN_READY",
            null
        );
    }

    @Transactional
    public UserNotification createFriendRequest(
        User recipient,
        User requester,
        Long friendshipId
    ) {
        return create(
            recipient,
            requester.getFullname() + " sent you a friend request",
            "Grow together in faith and encourage each other.",
            "FRIEND_REQUEST",
            friendshipId.toString()
        );
    }

    @Transactional
    public UserNotification create(
        User user,
        String title,
        String message,
        String type,
        String referenceId
    ) {
        UserNotification notification = new UserNotification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
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

    @Transactional
    public void resolve(
        Long userId,
        String type,
        String referenceId
    ) {
        notificationRepository
            .findFirstByUserUserIdAndTypeAndReferenceId(
                userId,
                type,
                referenceId
            )
            .ifPresent(notification -> {
                notification.setRead(true);
                notification.setReferenceId(null);
                notificationRepository.save(notification);
            });
    }

    private NotificationResponse toResponse(UserNotification notification) {
        return new NotificationResponse(
            notification.getNotificationId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getType(),
            notification.getReferenceId(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}
