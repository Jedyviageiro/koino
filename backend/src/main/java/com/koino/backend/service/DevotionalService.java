package com.koino.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.koino.backend.dto.plan.UserTaskDevotionalResponse;
import com.koino.backend.model.UserPlanPassage;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.model.UserTaskDevotional;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserTaskDevotionalRepository;
import com.koino.backend.repository.VerseRepository;
import com.koino.backend.service.GeminiDevotionalClient.GeneratedDevotional;
import com.koino.backend.service.LocalDevotionalCatalog.DevotionalTemplate;

@Service
public class DevotionalService {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(DevotionalService.class);
    private static final int MAX_SCRIPTURE_CHARACTERS = 12_000;

    private final UserPlanTaskRepository taskRepository;
    private final UserTaskDevotionalRepository devotionalRepository;
    private final VerseRepository verseRepository;
    private final GeminiDevotionalClient geminiClient;
    private final LocalDevotionalCatalog localCatalog;

    public DevotionalService(
        UserPlanTaskRepository taskRepository,
        UserTaskDevotionalRepository devotionalRepository,
        VerseRepository verseRepository,
        GeminiDevotionalClient geminiClient,
        LocalDevotionalCatalog localCatalog
    ) {
        this.taskRepository = taskRepository;
        this.devotionalRepository = devotionalRepository;
        this.verseRepository = verseRepository;
        this.geminiClient = geminiClient;
        this.localCatalog = localCatalog;
    }

    @Transactional
    public UserTaskDevotionalResponse getOrCreate(Long userId, Long taskId) {
        return devotionalRepository
            .findByTaskTaskIdAndTaskActivePlanUserUserId(taskId, userId)
            .map(this::toResponse)
            .orElseGet(() -> createOwnedTask(userId, taskId));
    }

    @Transactional
    public void generateForTask(Long taskId) {
        if (devotionalRepository.existsByTaskTaskId(taskId)) {
            return;
        }
        UserPlanTask task = taskRepository.findTaskForDevotional(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Plan task not found"));
        createForTask(task, false);
    }

    private UserTaskDevotionalResponse createOwnedTask(Long userId, Long taskId) {
        UserPlanTask task = taskRepository
            .findOwnedTaskForDevotional(taskId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Plan task not found"));
        var existing = devotionalRepository
            .findByTaskTaskIdAndTaskActivePlanUserUserId(taskId, userId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }
        return createForTask(task, true);
    }

    private UserTaskDevotionalResponse createForTask(
        UserPlanTask task,
        boolean enforceSchedule
    ) {
        if (enforceSchedule && task.getScheduledDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException(
                "This devotional is locked until " + task.getScheduledDate()
            );
        }
        var existing = devotionalRepository
            .findByTaskTaskIdAndTaskActivePlanUserUserId(
                task.getTaskId(),
                task.getActivePlan().getUser().getUserId()
            );
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        var reusable = devotionalRepository
            .findFirstByTaskReadingAssignmentOrderByDevotionalIdAsc(
                task.getReadingAssignment()
            );
        if (reusable.isPresent()) {
            return toResponse(saveCopy(task, reusable.get()));
        }
        var localTemplate = localCatalog.findByReadingAssignment(
            task.getReadingAssignment()
        );
        if (localTemplate.isPresent()) {
            return toResponse(saveLocalCopy(task, localTemplate.get()));
        }
        if (task.getPassages().isEmpty()) {
            throw new IllegalStateException(
                "This reading has no Bible passage assigned."
            );
        }

        ScriptureContext scripture = buildScriptureContext(task);
        GeneratedDevotional generated;
        try {
            generated = geminiClient.generate(buildPrompt(task, scripture));
        } catch (DevotionalGenerationException exception) {
            if (!enforceSchedule) {
                throw exception;
            }
            LOGGER.warn(
                "Serving a local devotional fallback for task {}: {}",
                task.getTaskId(),
                exception.getMessage()
            );
            return localFallback(task, scripture);
        }

        UserTaskDevotional devotional = new UserTaskDevotional();
        devotional.setTask(task);
        devotional.setTitle(generated.title());
        devotional.setAnchorVerseReference(scripture.anchorReference());
        devotional.setAnchorVerseText(scripture.anchorText());
        devotional.setOpening(generated.opening());
        devotional.setReflection(generated.reflection());
        devotional.setApplication(generated.application());
        devotional.setPrayer(generated.prayer());
        devotional.setModelName(generated.model());
        devotional.setGeneratedAt(Instant.now());
        return toResponse(devotionalRepository.save(devotional));
    }

    private UserTaskDevotionalResponse localFallback(
        UserPlanTask task,
        ScriptureContext scripture
    ) {
        String book = task.getPassages().getFirst()
            .getChapter()
            .getBook()
            .getTitle();
        String reflection = """
            Begin with the anchor verse and then read the full assigned passage \
            slowly. Notice the words or ideas that draw your attention, and \
            consider what they reveal within the passage.

            Return to the text once more without rushing toward an answer. Ask \
            where its truth meets your thoughts, choices, relationships, or \
            needs today.
            """;
        return new UserTaskDevotionalResponse(
            null,
            task.getTaskId(),
            task.getReadingAssignment(),
            task.getEstimatedMinutes(),
            scripture.verseCount(),
            "A Quiet Moment in " + book,
            scripture.anchorReference(),
            scripture.anchorText(),
            "Take a quiet moment with today's reading and let Scripture set "
                + "the pace.",
            reflection,
            "Choose one phrase from the passage to remember, and carry it into "
                + "one concrete decision or conversation today.",
            "Lord, help me listen carefully to Your Word and respond with "
                + "wisdom. Shape my heart and my actions through what I have "
                + "read today. Amen.",
            Instant.now()
        );
    }

    private UserTaskDevotional saveCopy(
        UserPlanTask task,
        UserTaskDevotional source
    ) {
        UserTaskDevotional devotional = new UserTaskDevotional();
        devotional.setTask(task);
        devotional.setTitle(source.getTitle());
        devotional.setAnchorVerseReference(source.getAnchorVerseReference());
        devotional.setAnchorVerseText(source.getAnchorVerseText());
        devotional.setOpening(source.getOpening());
        devotional.setReflection(source.getReflection());
        devotional.setApplication(source.getApplication());
        devotional.setPrayer(source.getPrayer());
        devotional.setModelName(source.getModelName());
        devotional.setGeneratedAt(Instant.now());
        return devotionalRepository.save(devotional);
    }

    private UserTaskDevotional saveLocalCopy(
        UserPlanTask task,
        DevotionalTemplate source
    ) {
        UserTaskDevotional devotional = new UserTaskDevotional();
        devotional.setTask(task);
        devotional.setTitle(source.title());
        devotional.setAnchorVerseReference(source.anchorVerseReference());
        devotional.setAnchorVerseText(source.anchorVerseText());
        devotional.setOpening(source.opening());
        devotional.setReflection(source.reflection());
        devotional.setApplication(source.application());
        devotional.setPrayer(source.prayer());
        devotional.setModelName(source.modelName());
        devotional.setGeneratedAt(Instant.now());
        return devotionalRepository.save(devotional);
    }

    private ScriptureContext buildScriptureContext(UserPlanTask task) {
        StringBuilder scripture = new StringBuilder();
        String anchorReference = null;
        String anchorText = null;
        int verseCount = 0;

        for (UserPlanPassage passage : task.getPassages()) {
            List<Verse> verses = verseRepository
                .findByChapterChapterIdOrderByVerseNumber(
                    passage.getChapter().getChapterId()
                )
                .stream()
                .filter(verse ->
                    verse.getVerseNumber() >= passage.getFirstVerse()
                        && verse.getVerseNumber() <= passage.getLastVerse()
                )
                .toList();
            for (Verse verse : verses) {
                String reference = passage.getChapter().getBook().getTitle()
                    + " "
                    + passage.getChapter().getChapterNumber()
                    + ":"
                    + verse.getVerseNumber();
                if (anchorReference == null) {
                    anchorReference = reference;
                    anchorText = verse.getText();
                }
                if (scripture.length() < MAX_SCRIPTURE_CHARACTERS) {
                    scripture.append(reference)
                        .append(" ")
                        .append(verse.getText())
                        .append("\n");
                }
                verseCount++;
            }
        }

        if (anchorReference == null || anchorText == null) {
            throw new IllegalStateException(
                "The Bible text for this reading is unavailable."
            );
        }
        return new ScriptureContext(
            anchorReference,
            anchorText,
            scripture.toString(),
            verseCount
        );
    }

    private String buildPrompt(UserPlanTask task, ScriptureContext scripture) {
        return """
            Write a concise Christian devotional grounded only in the supplied
            Bible passage. Use a warm, thoughtful, broadly Christian tone.
            Do not invent quotations, historical claims, or promises. Do not
            repeat the Bible text in the output. Keep the full devotional under
            420 words. The reflection must contain exactly two short paragraphs
            separated by a blank line. The prayer should be 2-3 sentences and
            written in first person. Return only the requested JSON fields.

            Reading assignment: %s
            Anchor verse: %s
            Scripture:
            %s
            """.formatted(
                task.getReadingAssignment(),
                scripture.anchorReference(),
                scripture.fullText()
            );
    }

    private UserTaskDevotionalResponse toResponse(UserTaskDevotional devotional) {
        UserPlanTask task = devotional.getTask();
        int verseCount = task.getPassages().stream()
            .mapToInt(passage ->
                Math.max(1, passage.getLastVerse() - passage.getFirstVerse() + 1)
            )
            .sum();
        return new UserTaskDevotionalResponse(
            devotional.getDevotionalId(),
            task.getTaskId(),
            task.getReadingAssignment(),
            task.getEstimatedMinutes(),
            verseCount,
            devotional.getTitle(),
            devotional.getAnchorVerseReference(),
            devotional.getAnchorVerseText(),
            devotional.getOpening(),
            devotional.getReflection(),
            devotional.getApplication(),
            devotional.getPrayer(),
            devotional.getGeneratedAt()
        );
    }

    private record ScriptureContext(
        String anchorReference,
        String anchorText,
        String fullText,
        int verseCount
    ) {}
}
