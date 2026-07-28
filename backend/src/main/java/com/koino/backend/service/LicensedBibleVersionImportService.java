package com.koino.backend.service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.BibleVerseText;
import com.koino.backend.model.BibleVersion;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BibleVerseTextRepository;
import com.koino.backend.repository.BibleVersionRepository;
import com.koino.backend.repository.VerseRepository;

@Service
public class LicensedBibleVersionImportService implements CommandLineRunner {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(LicensedBibleVersionImportService.class);

    private final BibleVersionRepository versionRepository;
    private final BibleVerseTextRepository verseTextRepository;
    private final VerseRepository verseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final boolean enabled;
    private final boolean rightsConfirmed;
    private final Path sourceDirectory;
    private final String versionCode;
    private final String versionName;
    private final String copyrightNotice;

    public LicensedBibleVersionImportService(
        BibleVersionRepository versionRepository,
        BibleVerseTextRepository verseTextRepository,
        VerseRepository verseRepository,
        @Value("${bible.licensed-import.enabled:false}") boolean enabled,
        @Value("${bible.licensed-import.rights-confirmed:false}")
            boolean rightsConfirmed,
        @Value("${bible.licensed-import.source-directory:/app/data/licensed-bibles}")
            String sourceDirectory,
        @Value("${bible.licensed-import.version-code:NIV}") String versionCode,
        @Value("${bible.licensed-import.version-name:New International Version}")
            String versionName,
        @Value("${bible.licensed-import.copyright-notice:}")
            String copyrightNotice
    ) {
        this.versionRepository = versionRepository;
        this.verseTextRepository = verseTextRepository;
        this.verseRepository = verseRepository;
        this.enabled = enabled;
        this.rightsConfirmed = rightsConfirmed;
        this.sourceDirectory = Path.of(sourceDirectory);
        this.versionCode = versionCode.trim().toUpperCase(Locale.ROOT);
        this.versionName = versionName.trim();
        this.copyrightNotice = copyrightNotice.trim();
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }
        if (!rightsConfirmed) {
            throw new IllegalStateException(
                "Licensed Bible import requires confirmed redistribution rights"
            );
        }
        if (copyrightNotice.isBlank()) {
            throw new IllegalStateException(
                "Licensed Bible import requires a copyright notice"
            );
        }
        Path booksFile = sourceDirectory.resolve("Books.json");
        if (!Files.isRegularFile(booksFile)) {
            throw new IllegalStateException(
                "Licensed Bible source is missing Books.json"
            );
        }

        BibleVersion version = versionRepository.findById(versionCode)
            .orElseGet(BibleVersion::new);
        version.setCode(versionCode);
        version.setName(versionName);
        version.setCopyrightNotice(copyrightNotice);
        version.setEnabled(false);
        versionRepository.save(version);

        Map<String, Verse> canonicalVerses = new HashMap<>();
        for (Verse verse : verseRepository.findAllWithReference()) {
            canonicalVerses.put(referenceKey(
                verse.getChapter().getBook().getTitle(),
                verse.getChapter().getChapterNumber(),
                verse.getVerseNumber()
            ), verse);
        }
        Map<Long, BibleVerseText> existingTexts = new HashMap<>();
        for (BibleVerseText text :
            verseTextRepository.findByVersionCode(versionCode)) {
            existingTexts.put(text.getVerse().getVerseId(), text);
        }

        JsonNode bookNames;
        try (InputStream input = Files.newInputStream(booksFile)) {
            bookNames = objectMapper.readTree(input);
        }
        int imported = 0;
        for (JsonNode bookNameNode : bookNames) {
            String bookName = bookNameNode.asText();
            Path bookFile = sourceDirectory.resolve(bookName + ".json");
            if (!Files.isRegularFile(bookFile)) {
                throw new IllegalStateException(
                    "Licensed Bible source is missing " + bookName + ".json"
                );
            }
            JsonNode book;
            try (InputStream input = Files.newInputStream(bookFile)) {
                book = objectMapper.readTree(input);
            }
            for (JsonNode chapter : book.path("chapters")) {
                int chapterNumber = chapter.path("chapter").asInt();
                for (JsonNode translatedVerse : chapter.path("verses")) {
                    int verseNumber = translatedVerse.path("verse").asInt();
                    Verse canonical = canonicalVerses.get(referenceKey(
                        bookName,
                        chapterNumber,
                        verseNumber
                    ));
                    if (canonical == null) {
                        throw new IllegalStateException(
                            "Licensed Bible reference does not match "
                                + bookName + " " + chapterNumber + ":"
                                + verseNumber
                        );
                    }
                    BibleVerseText verseText = existingTexts.getOrDefault(
                        canonical.getVerseId(),
                        new BibleVerseText()
                    );
                    verseText.setVersion(version);
                    verseText.setVerse(canonical);
                    verseText.setText(BibleTextCleaner.clean(
                        translatedVerse.path("text").asText()
                    ));
                    verseTextRepository.save(verseText);
                    existingTexts.put(canonical.getVerseId(), verseText);
                    imported++;
                }
            }
        }
        version.setEnabled(true);
        versionRepository.save(version);
        LOGGER.info(
            "Imported {} licensed {} Bible verses",
            imported,
            versionCode
        );
    }

    private String referenceKey(String book, int chapter, int verse) {
        return book.trim().toLowerCase(Locale.ROOT)
            + "|" + chapter + "|" + verse;
    }
}
