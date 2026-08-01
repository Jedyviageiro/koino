package com.koino.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.PlanTemplate;

@Service
public class PlanLocalizationService {
    private static final String PORTUGUESE_CATALOG =
        "reading-plans/reading-plan-catalog.pt.json";

    private final Map<String, Translation> portuguese;

    public PlanLocalizationService() {
        this.portuguese = loadPortugueseCatalog();
    }

    public String name(PlanTemplate plan, String language) {
        Translation translation = translation(plan.getPlanCode(), language);
        return translation == null ? plan.getName() : translation.name();
    }

    public String description(PlanTemplate plan, String language) {
        Translation translation = translation(plan.getPlanCode(), language);
        return translation == null
            ? plan.getDescription()
            : translation.description();
    }

    private Translation translation(String planCode, String language) {
        return isPortuguese(language) ? portuguese.get(planCode) : null;
    }

    private boolean isPortuguese(String language) {
        return language != null
            && language.toLowerCase(java.util.Locale.ROOT).startsWith("pt");
    }

    private Map<String, Translation> loadPortugueseCatalog() {
        ClassPathResource resource = new ClassPathResource(PORTUGUESE_CATALOG);
        try (InputStream input = resource.getInputStream()) {
            return Map.copyOf(new ObjectMapper().readValue(
                input,
                new TypeReference<Map<String, Translation>>() {}
            ));
        } catch (IOException exception) {
            throw new IllegalStateException(
                "Could not load Portuguese plan translations",
                exception
            );
        }
    }

    public record Translation(String name, String description) {}
}
