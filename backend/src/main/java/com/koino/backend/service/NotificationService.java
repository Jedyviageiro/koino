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
        boolean portuguese = isPortuguese(user);
        return create(
            user,
            localized(portuguese, "Your new plan is ready", "O seu novo plano está pronto"),
            localized(
                portuguese,
                planName + " is now available. Your first reading is waiting for you.",
                planName + " já está disponível. A sua primeira leitura está à sua espera."
            ),
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
        boolean portuguese = isPortuguese(recipient);
        return create(
            recipient,
            localized(
                portuguese,
                requester.getFullname() + " sent you a friend request",
                requester.getFullname() + " enviou-lhe um pedido de amizade"
            ),
            localized(
                portuguese,
                "Grow together in faith and encourage each other.",
                "Cresçam juntos na fé e encorajem-se mutuamente."
            ),
            "FRIEND_REQUEST",
            friendshipId.toString()
        );
    }

    @Transactional
    public UserNotification createReadingReminder(User user, Long taskId) {
        boolean portuguese = isPortuguese(user);
        return create(
            user,
            localized(portuguese, "Today's reading is waiting", "A leitura de hoje está à sua espera"),
            localized(
                portuguese,
                "Take a few quiet minutes to continue your plan.",
                "Reserve alguns minutos tranquilos para continuar o seu plano."
            ),
            "READING_REMINDER",
            taskId.toString()
        );
    }

    @Transactional
    public UserNotification createBattleChallenge(
        User recipient,
        User challenger,
        String modeName,
        String challengeId
    ) {
        boolean portuguese = isPortuguese(recipient);
        return create(
            recipient,
            localized(
                portuguese,
                challenger.getFullname() + " challenged you",
                challenger.getFullname() + " desafiou-o"
            ),
            localized(
                portuguese,
                modeName + " is waiting. Accept while you are both online.",
                modeName + " está à espera. Aceite enquanto ambos estão online."
            ),
            "BATTLE_CHALLENGE",
            challengeId
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
        return toResponse(notificationRepository.saveAndFlush(notification));
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

    private boolean isPortuguese(User user) {
        return user != null
            && user.getLanguage() != null
            && user.getLanguage().toLowerCase(java.util.Locale.ROOT).startsWith("pt");
    }

    private String localized(boolean portuguese, String english, String portugueseText) {
        return portuguese ? portugueseText : english;
    }
}
