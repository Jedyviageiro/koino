package com.koino.backend.controller;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/i18n")
public class LocaleController {
    @GetMapping("/locale")
    public Map<String, String> getLocale(
        @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, required = false)
            String acceptLanguage
    ) {
        return Map.of("locale", resolveLocale(acceptLanguage));
    }

    static String resolveLocale(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return "en";
        }
        try {
            List<Locale.LanguageRange> ranges =
                Locale.LanguageRange.parse(acceptLanguage);
            return ranges.stream()
                .map(Locale.LanguageRange::getRange)
                .anyMatch(language -> language.equals("pt")
                    || language.startsWith("pt-"))
                ? "pt-BR"
                : "en";
        } catch (IllegalArgumentException ignored) {
            return acceptLanguage.toLowerCase(Locale.ROOT).startsWith("pt")
                ? "pt-BR"
                : "en";
        }
    }
}
