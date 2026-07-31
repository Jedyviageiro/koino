package com.koino.backend.service;

import java.io.InputStream;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.dto.bible.VerseOfDayResponse;
import com.koino.backend.model.User;

@Service
public class VerseOfDayService {
    private static final String RESOURCE_PATH =
        "verse-of-the-day/365-day.json";
    private static final DateTimeFormatter MONTH_DAY =
        DateTimeFormatter.ofPattern("MM-dd");

    private final List<VerseEntry> entries;

    public VerseOfDayService() {
        ClassPathResource resource = new ClassPathResource(RESOURCE_PATH);
        try (InputStream input = resource.getInputStream()) {
            entries = new ObjectMapper().readValue(
                input,
                new TypeReference<>() {}
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Could not load the verse-of-the-day catalog",
                exception
            );
        }
        if (entries.isEmpty()) {
            throw new IllegalStateException(
                "The verse-of-the-day catalog is empty"
            );
        }
    }

    public VerseOfDayResponse forUser(User user) {
        LocalDate today = todayFor(user);
        String monthDay = today.format(MONTH_DAY);
        VerseEntry entry = entries.stream()
            .filter(candidate -> monthDay.equals(candidate.monthDay()))
            .findFirst()
            .orElseGet(() -> entries.get(
                (today.getDayOfYear() - 1) % entries.size()
            ));
        return new VerseOfDayResponse(
            entry.verse().reference(),
            entry.verse().text(),
            entry.theme(),
            entry.monthDay()
        );
    }

    private LocalDate todayFor(User user) {
        try {
            return LocalDate.now(ZoneId.of(user.getTimeZone()));
        } catch (DateTimeException exception) {
            return LocalDate.now(ZoneId.of("UTC"));
        }
    }

    private record VerseEntry(
        String date,
        String monthDay,
        VerseText verse,
        String theme,
        JsonNode holiday
    ) {}

    private record VerseText(String reference, String text) {}
}
