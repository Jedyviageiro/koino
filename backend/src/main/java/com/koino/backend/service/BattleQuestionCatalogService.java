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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
public class BattleQuestionCatalogService {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(BattleQuestionCatalogService.class);
    private static final String CORE_CATALOG =
        "battle/battle-question-catalog.json";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final Path generatedCatalogPath;
    private final Path bootstrapCatalogPath;

    public BattleQuestionCatalogService(
        JdbcTemplate jdbcTemplate,
        @Value("${battle.questions.backup-path}") String generatedCatalogPath,
        @Value("${battle.questions.bootstrap-path}")
            String bootstrapCatalogPath
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
        this.generatedCatalogPath = Path.of(generatedCatalogPath);
        this.bootstrapCatalogPath = Path.of(bootstrapCatalogPath);
    }

    @PostConstruct
    @Transactional
    public void seedCatalogs() {
        List<QuestionCatalogEntry> core = readCore();
        List<QuestionCatalogEntry> generated = readGenerated();
        List<QuestionCatalogEntry> catalog = new ArrayList<>(
            core.size() + generated.size()
        );
        catalog.addAll(core);
        catalog.addAll(generated);
        upsertAll(catalog, true);
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
        List<QuestionCatalogEntry> additions = new ArrayList<>();
        int before = local.size();
        for (QuestionCatalogEntry entry : generatedQuestions) {
            boolean exists = local.stream().anyMatch(
                current -> current.catalogKey().equals(entry.catalogKey())
            );
            if (!exists) {
                local.add(entry);
                additions.add(entry);
            }
        }
        upsertAll(additions, true);
        writeGenerated(local);
        return local.size() - before;
    }

    private void upsertAll(
        List<QuestionCatalogEntry> entries,
        boolean locallyBackedUp
    ) {
        if (entries.isEmpty()) {
            return;
        }
        jdbcTemplate.batchUpdate(
            """
            insert into battle_questions (
                catalog_key,
                prompt,
                optiona,
                optionb,
                optionc,
                optiond,
                correct_option,
                difficulty,
                category,
                reference,
                explanation,
                locally_backed_up
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (catalog_key) do update set
                prompt = excluded.prompt,
                optiona = excluded.optiona,
                optionb = excluded.optionb,
                optionc = excluded.optionc,
                optiond = excluded.optiond,
                correct_option = excluded.correct_option,
                difficulty = excluded.difficulty,
                category = excluded.category,
                reference = excluded.reference,
                explanation = excluded.explanation,
                locally_backed_up = excluded.locally_backed_up
            """,
            entries,
            500,
            (statement, entry) -> {
                statement.setString(1, entry.catalogKey());
                statement.setString(2, entry.prompt());
                statement.setString(3, entry.options().get(0));
                statement.setString(4, entry.options().get(1));
                statement.setString(5, entry.options().get(2));
                statement.setString(6, entry.options().get(3));
                statement.setInt(7, entry.correctOption());
                statement.setInt(8, entry.difficulty());
                statement.setString(9, entry.category());
                statement.setString(10, entry.reference());
                statement.setString(11, entry.explanation());
                statement.setBoolean(12, locallyBackedUp);
            }
        );
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
        initializeGeneratedBackup();
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

    private void initializeGeneratedBackup() {
        if (Files.exists(generatedCatalogPath)
            || !Files.isRegularFile(bootstrapCatalogPath)) {
            return;
        }
        try {
            Files.createDirectories(generatedCatalogPath.getParent());
            Files.copy(bootstrapCatalogPath, generatedCatalogPath);
            LOGGER.info("Initialized the persistent Battle Space backup");
        } catch (Exception exception) {
            LOGGER.warn(
                "Could not initialize the persistent Battle Space backup",
                exception
            );
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
