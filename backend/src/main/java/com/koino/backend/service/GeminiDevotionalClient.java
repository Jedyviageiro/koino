package com.koino.backend.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class GeminiDevotionalClient {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(GeminiDevotionalClient.class);
    private static final String API_ROOT =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public GeminiDevotionalClient(
        @Value("${gemini.api-key:}") String apiKey,
        @Value("${gemini.model:gemini-3.5-flash-lite}") String model
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public GeneratedDevotional generate(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new DevotionalGenerationException(
                "Gemini is not configured. Set GEMINI_KEY in the backend environment."
            );
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_ROOT + model + ":generateContent"))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(buildRequest(prompt)))
                .build();
            HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                JsonNode error = objectMapper.readTree(response.body());
                String upstreamMessage = error.path("error")
                    .path("message")
                    .asText("No upstream error message");
                LOGGER.warn(
                    "Gemini request failed with status {}: {}",
                    response.statusCode(),
                    upstreamMessage
                );
                throw new DevotionalGenerationException(
                    "Gemini could not create the devotional right now."
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            String generatedJson = root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText();
            if (generatedJson.isBlank()) {
                throw new DevotionalGenerationException(
                    "Gemini returned an empty devotional."
                );
            }

            JsonNode content = objectMapper.readTree(generatedJson);
            return new GeneratedDevotional(
                requiredText(content, "title"),
                requiredText(content, "opening"),
                requiredText(content, "reflection"),
                requiredText(content, "application"),
                requiredText(content, "prayer"),
                model
            );
        } catch (DevotionalGenerationException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new DevotionalGenerationException(
                "Devotional generation was interrupted.",
                exception
            );
        } catch (Exception exception) {
            throw new DevotionalGenerationException(
                "Gemini could not create the devotional right now.",
                exception
            );
        }
    }

    private String buildRequest(String prompt) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        contents.addObject().putArray("parts").addObject().put("text", prompt);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("maxOutputTokens", 900);
        ObjectNode schema = generationConfig.putObject("responseSchema");
        schema.put("type", "OBJECT");
        ObjectNode properties = schema.putObject("properties");
        addStringProperty(properties, "title", "A concise devotional title.");
        addStringProperty(properties, "opening", "A warm one-sentence opening.");
        addStringProperty(
            properties,
            "reflection",
            "Two short paragraphs explaining the passage."
        );
        addStringProperty(
            properties,
            "application",
            "One short paragraph applying the passage today."
        );
        addStringProperty(properties, "prayer", "A brief first-person prayer.");
        ArrayNode required = schema.putArray("required");
        required.add("title");
        required.add("opening");
        required.add("reflection");
        required.add("application");
        required.add("prayer");
        return objectMapper.writeValueAsString(root);
    }

    private void addStringProperty(
        ObjectNode properties,
        String name,
        String description
    ) {
        ObjectNode property = properties.putObject(name);
        property.put("type", "STRING");
        property.put("description", description);
    }

    private String requiredText(JsonNode content, String field) {
        String value = content.path(field).asText().trim();
        if (value.isBlank()) {
            throw new DevotionalGenerationException(
                "Gemini returned an incomplete devotional."
            );
        }
        return value;
    }

    public record GeneratedDevotional(
        String title,
        String opening,
        String reflection,
        String application,
        String prayer,
        String model
    ) {}
}
