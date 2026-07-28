package com.koino.backend.service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.BattleQuestion;
import com.koino.backend.repository.BattleQuestionRepository;

import jakarta.annotation.PostConstruct;

@Service
public class BattleQuestionCatalogService {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(BattleQuestionCatalogService.class);
    private static final String CORE_CATALOG =
        "battle/battle-question-catalog.json";

    private final BattleQuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final Path generatedCatalogPath;

    public BattleQuestionCatalogService(
        BattleQuestionRepository questionRepository,
        @Value("${battle.questions.backup-path}") String generatedCatalogPath
    ) {
        this.questionRepository = questionRepository;
        this.objectMapper = new ObjectMapper();
        this.generatedCatalogPath = Path.of(generatedCatalogPath);
    }

    @PostConstruct
    @Transactional
    public void seedCatalogs() {
        List<QuestionCatalogEntry> core = readCore();
        List<QuestionCatalogEntry> generated = readGenerated();
        core.forEach(entry -> upsert(entry, true));
        generated.forEach(entry -> upsert(entry, true));
        LOGGER.info(
            "Battle question bank ready with {} core and {} generated questions",
            core.size(),
            generated.size()
        );
    }

    @Transactional
    public synchronized int appendGenerated(
        List<QuestionCatalogEntry> generatedQuestions
    ) {
        if (generatedQuestions == null || generatedQuestions.isEmpty()) {
            return 0;
        }
        List<QuestionCatalogEntry> local = new ArrayList<>(readGenerated());
        int before = local.size();
        for (QuestionCatalogEntry entry : generatedQuestions) {
            boolean exists = local.stream().anyMatch(
                current -> current.catalogKey().equals(entry.catalogKey())
            );
            if (!exists) {
                local.add(entry);
                upsert(entry, true);
            }
        }
        writeGenerated(local);
        return local.size() - before;
    }

    private void upsert(QuestionCatalogEntry entry, boolean locallyBackedUp) {
        BattleQuestion question = questionRepository
            .findByCatalogKey(entry.catalogKey())
            .orElseGet(BattleQuestion::new);
        question.setCatalogKey(entry.catalogKey());
        question.setPrompt(entry.prompt());
        question.setOptionA(entry.options().get(0));
        question.setOptionB(entry.options().get(1));
        question.setOptionC(entry.options().get(2));
        question.setOptionD(entry.options().get(3));
        question.setCorrectOption(entry.correctOption());
        question.setDifficulty(entry.difficulty());
        question.setCategory(entry.category());
        question.setReference(entry.reference());
        question.setExplanation(entry.explanation());
        question.setLocallyBackedUp(locallyBackedUp);
        questionRepository.save(question);
    }

    private List<QuestionCatalogEntry> readCore() {
        try (InputStream stream = new ClassPathResource(CORE_CATALOG)
            .getInputStream()) {
            return Arrays.asList(
                objectMapper.readValue(stream, QuestionCatalogEntry[].class)
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not load the core Battle Space question catalog",
                exception
            );
        }
    }

    private List<QuestionCatalogEntry> readGenerated() {
        if (!Files.exists(generatedCatalogPath)) {
            return List.of();
        }
        try {
            return Arrays.asList(objectMapper.readValue(
                generatedCatalogPath.toFile(),
                QuestionCatalogEntry[].class
            ));
        } catch (Exception exception) {
            LOGGER.warn("Could not load generated Battle Space backup", exception);
            return List.of();
        }
    }

    private void writeGenerated(List<QuestionCatalogEntry> entries) {
        try {
            Files.createDirectories(generatedCatalogPath.getParent());
            Path temporary = generatedCatalogPath.resolveSibling(
                generatedCatalogPath.getFileName() + ".tmp"
            );
            objectMapper.writerWithDefaultPrettyPrinter()
                .writeValue(temporary.toFile(), entries);
            Files.move(
                temporary,
                generatedCatalogPath,
                StandardCopyOption.REPLACE_EXISTING,
                StandardCopyOption.ATOMIC_MOVE
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not back up generated Battle Space questions",
                exception
            );
        }
    }

    public record QuestionCatalogEntry(
        String catalogKey,
        String prompt,
        List<String> options,
        int correctOption,
        int difficulty,
        String category,
        String reference,
        String explanation
    ) {
        public QuestionCatalogEntry {
            if (catalogKey == null
                || prompt == null
                || options == null
                || options.size() != 4
                || correctOption < 0
                || correctOption > 3
                || difficulty < 1
                || difficulty > 6
                || explanation == null) {
                throw new IllegalArgumentException(
                    "Invalid Battle Space question"
                );
            }
        }
    }
}
