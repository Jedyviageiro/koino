package com.koino.backend.service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class LocalDevotionalCatalog {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(LocalDevotionalCatalog.class);
    private static final String CATALOG_PATH =
        "devotionals/devotional-catalog.json";

    private final Map<String, DevotionalTemplate> byReadingAssignment;

    public LocalDevotionalCatalog() {
        this.byReadingAssignment = loadCatalog();
    }

    public Optional<DevotionalTemplate> findByReadingAssignment(
        String readingAssignment
    ) {
        return Optional.ofNullable(byReadingAssignment.get(readingAssignment));
    }

    public int size() {
        return byReadingAssignment.size();
    }

    private Map<String, DevotionalTemplate> loadCatalog() {
        ClassPathResource resource = new ClassPathResource(CATALOG_PATH);
        if (!resource.exists()) {
            LOGGER.warn("Local devotional catalog is not present");
            return Map.of();
        }

        try (InputStream input = resource.getInputStream()) {
            List<DevotionalTemplate> templates = new ObjectMapper().readValue(
                input,
                new TypeReference<>() {}
            );
            Map<String, DevotionalTemplate> catalog = templates.stream()
                .collect(Collectors.toUnmodifiableMap(
                    DevotionalTemplate::readingAssignment,
                    Function.identity()
                ));
            LOGGER.info(
                "Loaded {} locally backed-up devotionals",
                catalog.size()
            );
            return catalog;
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not load the local devotional catalog",
                exception
            );
        }
    }

    public record DevotionalTemplate(
        String readingAssignment,
        String title,
        String anchorVerseReference,
        String anchorVerseText,
        String opening,
        String reflection,
        String application,
        String prayer,
        String modelName
    ) {}
}
