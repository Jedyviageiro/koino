package com.koino.backend.service;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.koino.backend.model.ReportReason;

@Component
public class ContentModerationService {
    private static final String API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models/";
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    private final String apiKey;
    private final String model;

    public ContentModerationService(@Value("${gemini.api-key:}") String apiKey, @Value("${gemini.model:gemini-3.5-flash-lite}") String model) {
        this.apiKey = apiKey; this.model = model;
    }

    public ModerationResult reviewImage(byte[] bytes, String mimeType, String caption) {
        if (apiKey == null || apiKey.isBlank()) throw new ModerationUnavailableException("Photo safety review is temporarily unavailable. Please try again shortly.");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_ROOT + model + ":generateContent"))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(payload(bytes, mimeType, caption)))
                .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) throw new ModerationUnavailableException("Photo safety review is temporarily unavailable. Please try again shortly.");
            JsonNode root = mapper.readTree(response.body());
            String output = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            if (output.isBlank()) return new ModerationResult(false, ReportReason.INAPPROPRIATE_CONTENT, 1, true);
            JsonNode result = mapper.readTree(output);
            String decision = result.path("decision").asText("REVIEW");
            double confidence = Math.max(0, Math.min(1, result.path("confidence").asDouble(.5)));
            ReportReason reason = parseReason(result.path("category").asText());
            return new ModerationResult(decision.equalsIgnoreCase("ALLOW"), reason, confidence, decision.equalsIgnoreCase("REJECT") && confidence >= .90);
        } catch (ModerationUnavailableException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ModerationUnavailableException("Photo safety review was interrupted. Please try again.", exception);
        } catch (Exception exception) {
            throw new ModerationUnavailableException("Photo safety review is temporarily unavailable. Please try again shortly.", exception);
        }
    }

    private String payload(byte[] bytes, String mimeType, String caption) throws Exception {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode parts = root.putArray("contents").addObject().putArray("parts");
        parts.addObject().put("text", "Classify this user-uploaded image for a public all-ages Christian community. Reject pornography, sexual nudity, sexualized minors, graphic violence, credible threats, targeted hateful imagery, or severe harassment. Do not reject respectful disagreement, other religions, ordinary Bible art, breastfeeding, or non-sexual medical content. Caption: " + (caption == null ? "" : caption));
        ObjectNode inline = parts.addObject().putObject("inlineData");
        inline.put("mimeType", mimeType); inline.put("data", Base64.getEncoder().encodeToString(bytes));
        ObjectNode config = root.putObject("generationConfig");
        config.put("responseMimeType", "application/json"); config.put("maxOutputTokens", 160);
        ObjectNode schema = config.putObject("responseSchema"); schema.put("type", "OBJECT");
        ObjectNode properties = schema.putObject("properties");
        properties.putObject("decision").put("type", "STRING").putArray("enum").add("ALLOW").add("REVIEW").add("REJECT");
        properties.putObject("category").put("type", "STRING"); properties.putObject("confidence").put("type", "NUMBER");
        schema.putArray("required").add("decision").add("category").add("confidence");
        return mapper.writeValueAsString(root);
    }

    private ReportReason parseReason(String value) {
        String normalized = value == null ? "" : value.toUpperCase();
        if (normalized.contains("SEX") || normalized.contains("NUD")) return ReportReason.SEXUAL_CONTENT;
        if (normalized.contains("HATE")) return ReportReason.HATE_SPEECH;
        if (normalized.contains("THREAT") || normalized.contains("VIOLENCE")) return ReportReason.THREATS_OR_VIOLENCE;
        if (normalized.contains("HARASS")) return ReportReason.HARASSMENT;
        if (normalized.contains("SPAM")) return ReportReason.SPAM;
        return ReportReason.INAPPROPRIATE_CONTENT;
    }

    public record ModerationResult(boolean allowed, ReportReason reason, double confidence, boolean severe) {}
}
