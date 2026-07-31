package com.koino.backend.service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.User;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.service.GmailService.EmailService;

@Service
public class ReadingReminderService {
    private final UserPlanTaskRepository taskRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final int reminderHour;

    public ReadingReminderService(
        UserPlanTaskRepository taskRepository,
        NotificationService notificationService,
        EmailService emailService,
        @Value("${reading.reminder.local-hour:18}") int reminderHour
    ) {
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.reminderHour = Math.max(0, Math.min(23, reminderHour));
    }

    @Scheduled(
        initialDelayString = "${reading.reminder.initial-delay-ms:60000}",
        fixedDelayString = "${reading.reminder.delay-ms:3600000}"
    )
    @Transactional
    public void remindUsersWithUnreadPlans() {
        for (
            UserPlanTask task
                : taskRepository.findCurrentIncompleteTasksForReminders()
        ) {
            User user = task.getActivePlan().getUser();
            ZonedDateTime localNow = nowFor(user);
            LocalDate localDate = localNow.toLocalDate();
            if (
                localNow.getHour() < reminderHour
                    || task.getScheduledDate().isAfter(localDate)
                    || localDate.equals(task.getLastReminderSentOn())
            ) {
                continue;
            }

            task.setLastReminderSentOn(localDate);
            taskRepository.save(task);
            notificationService.create(
                user,
                "Today's reading is waiting",
                "Take a few quiet minutes to continue your plan.",
                "READING_REMINDER",
                task.getTaskId().toString()
            );
            if (user.isEmailVerified()) {
                emailService.sendReadingReminder(user);
            }
        }
    }

    private ZonedDateTime nowFor(User user) {
        try {
            return ZonedDateTime.now(ZoneId.of(user.getTimeZone()));
        } catch (DateTimeException exception) {
            return ZonedDateTime.now(ZoneId.of("UTC"));
        }
    }
}
