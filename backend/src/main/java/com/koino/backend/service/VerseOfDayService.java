package com.koino.backend.service;

import java.io.InputStream;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.dto.bible.VerseOfDayResponse;
import com.koino.backend.model.User;
import com.koino.backend.repository.BibleVerseTextRepository;
import com.koino.backend.repository.VerseRepository;

@Service
public class VerseOfDayService {
    private static final String RESOURCE_PATH =
        "verse-of-the-day/365-day.json";
    private static final DateTimeFormatter MONTH_DAY =
        DateTimeFormatter.ofPattern("MM-dd");
    private static final Pattern REFERENCE = Pattern.compile(
        "^(.+?)\\s+(\\d+):(\\d+)"
    );

    private final List<VerseEntry> entries;
    private final VerseRepository verseRepository;
    private final BibleVerseTextRepository verseTextRepository;

    public VerseOfDayService(
        VerseRepository verseRepository,
        BibleVerseTextRepository verseTextRepository
    ) {
        this.verseRepository = verseRepository;
        this.verseTextRepository = verseTextRepository;
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
        String text = localizedText(entry, user);
        return new VerseOfDayResponse(
            entry.verse().reference(),
            text,
            entry.theme(),
            entry.monthDay()
        );
    }

    private String localizedText(VerseEntry entry, User user) {
        String language = user.getLanguage();
        String version = language != null && language.toLowerCase().startsWith("pt")
            ? "NVI"
            : "NIV";
        Matcher matcher = REFERENCE.matcher(entry.verse().reference());
        if (!matcher.find()) {
            return entry.verse().text();
        }
        return verseRepository
            .findByChapterBookTitleIgnoreCaseAndChapterChapterNumberAndVerseNumber(
                matcher.group(1),
                Integer.valueOf(matcher.group(2)),
                Integer.valueOf(matcher.group(3))
            )
            .flatMap(verse -> verseTextRepository
                .findByVersionCodeAndVerseVerseId(version, verse.getVerseId()))
            .map(text -> text.getText())
            .orElse(entry.verse().text());
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
