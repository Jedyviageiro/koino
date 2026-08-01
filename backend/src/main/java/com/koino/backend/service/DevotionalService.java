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
import com.koino.backend.repository.BibleVerseTextRepository;
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
    private final BibleVerseTextRepository bibleVerseTextRepository;
    private final GeminiDevotionalClient geminiClient;
    private final LocalDevotionalCatalog localCatalog;

    public DevotionalService(
        UserPlanTaskRepository taskRepository,
        UserTaskDevotionalRepository devotionalRepository,
        VerseRepository verseRepository,
        BibleVerseTextRepository bibleVerseTextRepository,
        GeminiDevotionalClient geminiClient,
        LocalDevotionalCatalog localCatalog
    ) {
        this.taskRepository = taskRepository;
        this.devotionalRepository = devotionalRepository;
        this.verseRepository = verseRepository;
        this.bibleVerseTextRepository = bibleVerseTextRepository;
        this.geminiClient = geminiClient;
        this.localCatalog = localCatalog;
    }

    @Transactional
    public UserTaskDevotionalResponse getOrCreate(Long userId, Long taskId) {
        var existing = devotionalRepository
            .findByTaskTaskIdAndTaskActivePlanUserUserId(taskId, userId);
        if (existing.isPresent()
            && sameLanguage(
                existing.get(),
                languageFor(existing.get().getTask())
            )) {
            return toResponse(existing.get());
        }
        return createOwnedTask(userId, taskId);
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
        String language = languageFor(task);
        if (existing.isPresent() && sameLanguage(existing.get(), language)) {
            return toResponse(existing.get());
        }
        existing.ifPresent(devotionalRepository::delete);
        devotionalRepository.flush();
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
        String language = languageFor(task);
        if (existing.isPresent() && sameLanguage(existing.get(), language)) {
            return toResponse(existing.get());
        }
        existing.ifPresent(devotionalRepository::delete);
        devotionalRepository.flush();

        var reusable = devotionalRepository
            .findFirstByTaskReadingAssignmentAndLanguageOrderByDevotionalIdAsc(
                task.getReadingAssignment(),
                language
            );
        if (reusable.isPresent()) {
            return toResponse(saveCopy(task, reusable.get()));
        }
        var localTemplate = isPortuguese(language)
            ? java.util.Optional.<DevotionalTemplate>empty()
            : localCatalog.findByReadingAssignment(task.getReadingAssignment());
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
        devotional.setLanguage(language);
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
        boolean portuguese = isPortuguese(languageFor(task));
        String reflection = portuguese ? """
            Comece pelo versículo em destaque e depois leia lentamente toda a
            passagem indicada. Observe as palavras ou ideias que chamam a sua
            atenção e pense no que elas revelam dentro da passagem.

            Volte ao texto sem pressa de encontrar uma resposta. Pergunte onde
            esta verdade toca os seus pensamentos, escolhas, relacionamentos
            ou necessidades de hoje.
            """ : """
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
            portuguese ? "Um Momento Tranquilo em " + book : "A Quiet Moment in " + book,
            scripture.anchorReference(),
            scripture.anchorText(),
            portuguese
                ? "Reserve um momento tranquilo para a leitura de hoje e deixe a Escritura orientar o seu ritmo."
                : "Take a quiet moment with today's reading and let Scripture set the pace.",
            reflection,
            portuguese
                ? "Escolha uma frase da passagem para recordar e leve-a para uma decisão ou conversa concreta hoje."
                : "Choose one phrase from the passage to remember, and carry it into one concrete decision or conversation today.",
            portuguese
                ? "Senhor, ajuda-me a ouvir atentamente a Tua Palavra e a responder com sabedoria. Molda o meu coração e as minhas ações através do que li hoje. Amém."
                : "Lord, help me listen carefully to Your Word and respond with wisdom. Shape my heart and my actions through what I have read today. Amen.",
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
        devotional.setLanguage(languageFor(task));
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
        devotional.setLanguage(languageFor(task));
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
                    anchorText = localizedVerseText(task, verse);
                }
                if (scripture.length() < MAX_SCRIPTURE_CHARACTERS) {
                    scripture.append(reference)
                        .append(" ")
                        .append(localizedVerseText(task, verse))
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
        String languageInstruction = isPortuguese(languageFor(task))
            ? "Write every JSON text field in natural Brazilian Portuguese (pt-BR)."
            : "Write every JSON text field in natural English.";
        return """
            Write a concise Christian devotional grounded only in the supplied
            Bible passage. Use a warm, thoughtful, broadly Christian tone.
            Do not invent quotations, historical claims, or promises. Do not
            repeat the Bible text in the output. Keep the full devotional under
            420 words. The reflection must contain exactly two short paragraphs
            separated by a blank line. The prayer should be 2-3 sentences and
            written in first person. Return only the requested JSON fields.
            %s

            Reading assignment: %s
            Anchor verse: %s
            Scripture:
            %s
            """.formatted(
                languageInstruction,
                task.getReadingAssignment(),
                scripture.anchorReference(),
                scripture.fullText()
            );
    }

    private String localizedVerseText(UserPlanTask task, Verse verse) {
        String version = isPortuguese(languageFor(task)) ? "NVI" : "NIV";
        return bibleVerseTextRepository.findByVersionCodeAndVerseVerseId(
            version,
            verse.getVerseId()
        ).map(text -> text.getText()).orElse(verse.getText());
    }

    private String languageFor(UserPlanTask task) {
        String language = task.getActivePlan().getUser().getLanguage();
        return isPortuguese(language) ? "pt" : "en";
    }

    private boolean sameLanguage(UserTaskDevotional devotional, String language) {
        String stored = devotional.getLanguage();
        return (stored == null ? "en" : stored).equals(language);
    }

    private boolean isPortuguese(String language) {
        return language != null
            && language.toLowerCase(java.util.Locale.ROOT).startsWith("pt");
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
