package com.koino.backend.service;

import java.time.Instant;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.koino.backend.repository.UserPlanTaskRepository;

@Component
@ConditionalOnProperty(
    name = "devotional.backfill.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class DevotionalBackfillWorker {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(DevotionalBackfillWorker.class);

    private final UserPlanTaskRepository taskRepository;
    private final DevotionalService devotionalService;
    private final int horizonDays;
    private Instant retryAfter = Instant.EPOCH;

    public DevotionalBackfillWorker(
        UserPlanTaskRepository taskRepository,
        DevotionalService devotionalService,
        @Value("${devotional.backfill.horizon-days:14}") int horizonDays
    ) {
        this.taskRepository = taskRepository;
        this.devotionalService = devotionalService;
        this.horizonDays = horizonDays;
    }

    @Scheduled(
        initialDelayString = "${devotional.backfill.initial-delay:PT20S}",
        fixedDelayString = "${devotional.backfill.delay:PT1S}"
    )
    public void generateNextMissingDevotional() {
        if (Instant.now().isBefore(retryAfter)) {
            return;
        }

        taskRepository.findTaskIdsWithoutDevotional(
                LocalDate.now().plusDays(horizonDays),
                PageRequest.of(0, 1)
            )
            .stream()
            .findFirst()
            .ifPresent(taskId -> {
                try {
                    devotionalService.generateForTask(taskId);
                    retryAfter = Instant.EPOCH;
                } catch (GeminiRateLimitException exception) {
                    retryAfter = Instant.now().plusSeconds(3600);
                    LOGGER.warn(
                        "Devotional backfill paused for one hour after Gemini "
                            + "rate-limited task {}",
                        taskId
                    );
                } catch (RuntimeException exception) {
                    retryAfter = Instant.now().plusSeconds(60);
                    LOGGER.warn(
                        "Devotional backfill paused after task {} failed: {}",
                        taskId,
                        exception.getMessage()
                    );
                }
            });
    }
}
