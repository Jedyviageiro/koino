package com.koino.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.koino.backend.service.BattleQuestionCatalogService.QuestionCatalogEntry;

@Component
public class GeminiBattleQuestionClient {
    private static final String API_ROOT =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public GeminiBattleQuestionClient(
        @Value("${gemini.api-key:}") String apiKey,
        @Value("${gemini.model:gemini-3.5-flash-lite}") String model
    ) {
        this.objectMapper = new ObjectMapper();
        this.apiKey = apiKey;
        this.model = model;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public List<QuestionCatalogEntry> generate(int difficulty, int count) {
        if (apiKey == null || apiKey.isBlank()) {
            return List.of();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_ROOT + model + ":generateContent"))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(
                    buildRequest(difficulty, count)
                ))
                .build();
            HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                    "Gemini question generation returned "
                        + response.statusCode()
                );
            }
            String json = objectMapper.readTree(response.body())
                .path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText();
            JsonNode generated = objectMapper.readTree(json);
            List<QuestionCatalogEntry> entries = new ArrayList<>();
            for (JsonNode node : generated) {
                List<String> options = new ArrayList<>();
                node.path("options").forEach(option -> options.add(option.asText()));
                entries.add(new QuestionCatalogEntry(
                    "gemini-" + difficulty + "-"
                        + UUID.randomUUID().toString().substring(0, 12),
                    node.path("prompt").asText(),
                    options,
                    node.path("correctOption").asInt(-1),
                    difficulty,
                    node.path("category").asText("Bible"),
                    node.path("reference").asText(),
                    node.path("explanation").asText()
                ));
            }
            return entries;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Gemini could not generate Battle Space questions",
                exception
            );
        }
    }

    private String buildRequest(int difficulty, int count) throws Exception {
        String prompt = """
            Create exactly %d factual four-option Bible quiz questions for
            difficulty tier %d of 6. Tier 1 is beginner Bible literacy. Tier 6
            is expert-level detail involving obscure people, precise locations,
            textual structure, cross-references, and exact narrative details.
            Every answer must be unambiguous and supported by the stated Bible
            reference. Use the full Protestant 66-book canon. Avoid theological
            disputes, translation-dependent word counts, trick wording, and
            duplicate questions. correctOption is zero-based. Explanations must
            be one concise factual sentence.
            """.formatted(count, difficulty);

        ObjectNode root = objectMapper.createObjectNode();
        root.putArray("contents")
            .addObject()
            .putArray("parts")
            .addObject()
            .put("text", prompt);
        ObjectNode config = root.putObject("generationConfig");
        config.put("responseMimeType", "application/json");
        config.put("maxOutputTokens", 5000);
        ObjectNode schema = config.putObject("responseSchema");
        schema.put("type", "ARRAY");
        ObjectNode item = schema.putObject("items");
        item.put("type", "OBJECT");
        ObjectNode properties = item.putObject("properties");
        stringProperty(properties, "prompt");
        ObjectNode options = properties.putObject("options");
        options.put("type", "ARRAY");
        options.putObject("items").put("type", "STRING");
        ObjectNode correct = properties.putObject("correctOption");
        correct.put("type", "INTEGER");
        correct.put("minimum", 0);
        correct.put("maximum", 3);
        stringProperty(properties, "category");
        stringProperty(properties, "reference");
        stringProperty(properties, "explanation");
        ArrayNode required = item.putArray("required");
        required.add("prompt");
        required.add("options");
        required.add("correctOption");
        required.add("category");
        required.add("reference");
        required.add("explanation");
        return objectMapper.writeValueAsString(root);
    }

    private void stringProperty(ObjectNode properties, String name) {
        properties.putObject(name).put("type", "STRING");
    }
}
