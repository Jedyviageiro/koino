package com.koino.backend.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.bible.BibleVersionResponse;
import com.koino.backend.dto.bible.BibleVerseResponse;
import com.koino.backend.model.BibleVersion;
import com.koino.backend.model.BibleVerseText;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BibleVersionRepository;
import com.koino.backend.repository.BibleVerseTextRepository;
import com.koino.backend.repository.VerseRepository;

import jakarta.annotation.PostConstruct;

@Service
public class BibleVersionService {
    public static final String DEFAULT_VERSION = "KJV";

    private final BibleVersionRepository versionRepository;
    private final BibleVerseTextRepository verseTextRepository;
    private final VerseRepository verseRepository;

    public BibleVersionService(
        BibleVersionRepository versionRepository,
        BibleVerseTextRepository verseTextRepository,
        VerseRepository verseRepository
    ) {
        this.versionRepository = versionRepository;
        this.verseTextRepository = verseTextRepository;
        this.verseRepository = verseRepository;
    }

    @PostConstruct
    public void ensureDefaultVersion() {
        BibleVersion kjv = versionRepository.findById(DEFAULT_VERSION)
            .orElseGet(BibleVersion::new);
        kjv.setCode(DEFAULT_VERSION);
        kjv.setName("King James Version");
        kjv.setEnabled(true);
        versionRepository.save(kjv);
    }

    @Transactional(readOnly = true)
    public List<BibleVersionResponse> getEnabledVersions() {
        return versionRepository.findByEnabledTrueOrderByNameAsc().stream()
            .map(version -> new BibleVersionResponse(
                version.getCode(),
                version.getName(),
                version.getCopyrightNotice()
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BibleVerseResponse> getChapter(
        Long chapterId,
        String requestedVersion
    ) {
        String versionCode = normalize(requestedVersion);
        BibleVersion version = versionRepository.findById(versionCode)
            .filter(BibleVersion::isEnabled)
            .orElseThrow(() -> new IllegalArgumentException(
                "That Bible version is not available"
            ));
        List<Verse> verses =
            verseRepository.findByChapterChapterIdOrderByVerseNumber(chapterId);
        if (DEFAULT_VERSION.equals(version.getCode())) {
            return verses.stream().map(verse -> toResponse(
                verse,
                verse.getText()
            )).toList();
        }

        Map<Long, BibleVerseText> translated =
            verseTextRepository
                .findByVersionCodeAndVerseChapterChapterIdOrderByVerseVerseNumber(
                    versionCode,
                    chapterId
                )
                .stream()
                .collect(Collectors.toMap(
                    text -> text.getVerse().getVerseId(),
                    Function.identity()
                ));
        return verses.stream()
            .map(verse -> toResponse(
                verse,
                translated.containsKey(verse.getVerseId())
                    ? translated.get(verse.getVerseId()).getText()
                    : verse.getText()
            ))
            .toList();
    }

    private BibleVerseResponse toResponse(Verse verse, String text) {
        return new BibleVerseResponse(
            verse.getVerseId(),
            verse.getChapter(),
            verse.getVerseNumber(),
            text
        );
    }

    private String normalize(String requestedVersion) {
        return requestedVersion == null || requestedVersion.isBlank()
            ? DEFAULT_VERSION
            : requestedVersion.trim().toUpperCase(Locale.ROOT);
    }
}
