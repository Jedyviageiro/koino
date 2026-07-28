package com.koino.backend.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.BibleVerseText;
import com.koino.backend.model.BibleVersion;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BibleVerseTextRepository;
import com.koino.backend.repository.BibleVersionRepository;
import com.koino.backend.repository.VerseRepository;

@Service
@Order(20)
public class LicensedBibleVersionImportService implements CommandLineRunner {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(LicensedBibleVersionImportService.class);
    private static final String FLAT_SOURCE_FILE = "bible-niv.txt";
    private static final String FLAT_REFERENCE_MANIFEST =
        "niv-reference-manifest.json";
    private static final Set<String> MERGED_CONTINUATION_REFERENCES = Set.of(
        "Exodus|30:24",
        "Numbers|31:33",
        "Numbers|31:34",
        "Numbers|31:37",
        "Numbers|31:39",
        "Numbers|31:40",
        "Numbers|31:44",
        "Numbers|31:45",
        "Ezra|2:67",
        "Ezra|8:27",
        "Nehemiah|7:69",
        "3 John|1:15"
    );

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
        validateConfiguration();

        List<Verse> canonicalVerses = verseRepository.findAllWithReference();
        if (canonicalVerses.isEmpty()) {
            throw new IllegalStateException(
                "Licensed Bible import requires canonical Bible data"
            );
        }

        BibleVersion version = versionRepository.findById(versionCode)
            .orElseGet(BibleVersion::new);
        List<BibleVerseText> storedTexts =
            verseTextRepository.findByVersionCode(versionCode);
        if (version.isEnabled()
            && storedTexts.size() == canonicalVerses.size()) {
            updateVersionMetadata(version, true);
            versionRepository.save(version);
            LOGGER.info(
                "{} is already imported with {} verses",
                versionCode,
                storedTexts.size()
            );
            return;
        }

        updateVersionMetadata(version, false);
        versionRepository.save(version);

        Map<String, String> translatedByReference = loadTranslations();
        Map<Long, BibleVerseText> existingTexts = new HashMap<>();
        for (BibleVerseText text : storedTexts) {
            existingTexts.put(text.getVerse().getVerseId(), text);
        }

        List<BibleVerseText> importedTexts =
            new ArrayList<>(canonicalVerses.size());
        for (Verse canonical : canonicalVerses) {
            BibleVerseText verseText = existingTexts.getOrDefault(
                canonical.getVerseId(),
                new BibleVerseText()
            );
            verseText.setVersion(version);
            verseText.setVerse(canonical);
            verseText.setText(BibleTextCleaner.clean(
                translatedByReference.getOrDefault(
                    referenceKey(canonical),
                    ""
                )
            ));
            importedTexts.add(verseText);
        }
        verseTextRepository.saveAll(importedTexts);

        updateVersionMetadata(version, true);
        versionRepository.save(version);
        LOGGER.info(
            "Imported {} licensed {} Bible verse slots from {} source texts",
            importedTexts.size(),
            versionCode,
            translatedByReference.size()
        );
    }

    private void validateConfiguration() {
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
    }

    private void updateVersionMetadata(BibleVersion version, boolean active) {
        version.setCode(versionCode);
        version.setName(versionName);
        version.setCopyrightNotice(copyrightNotice);
        version.setEnabled(active);
    }

    private Map<String, String> loadTranslations() throws Exception {
        Path flatSource = sourceDirectory.resolve(FLAT_SOURCE_FILE);
        if (Files.isRegularFile(flatSource)) {
            return loadFlatTextTranslations(flatSource);
        }
        return loadJsonTranslations();
    }

    private Map<String, String> loadFlatTextTranslations(Path source)
        throws Exception {
        Path manifestFile = sourceDirectory.resolve(FLAT_REFERENCE_MANIFEST);
        if (!Files.isRegularFile(manifestFile)) {
            throw new IllegalStateException(
                "Licensed flat Bible source is missing "
                    + FLAT_REFERENCE_MANIFEST
            );
        }

        List<FlatBibleBookManifest> manifests;
        try (InputStream input = Files.newInputStream(manifestFile)) {
            manifests = objectMapper.readValue(
                input,
                new TypeReference<List<FlatBibleBookManifest>>() {}
            );
        }

        String raw = Files.readString(source, StandardCharsets.UTF_8)
            .replace("\r\n", "\n")
            .replace('\r', '\n');
        List<String> bookChunks = List.of(
            raw.split("(?:\\n\\s*){4,}")
        ).stream().filter(chunk -> !chunk.isBlank()).toList();
        if (bookChunks.size() != manifests.size()) {
            throw new IllegalStateException(
                "Licensed flat Bible source has " + bookChunks.size()
                    + " books; expected " + manifests.size()
            );
        }

        Map<String, String> translations = new HashMap<>();
        for (int bookIndex = 0; bookIndex < manifests.size(); bookIndex++) {
            FlatBibleBookManifest manifest = manifests.get(bookIndex);
            List<String> lines = bookChunks.get(bookIndex).lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .filter(line ->
                    !"Psalms".equalsIgnoreCase(manifest.book())
                        || !line.matches("(?i)PSALM\\s+\\d+")
                )
                .toList();
            if (lines.isEmpty()
                || !matchesHeading(lines.getFirst(), manifest.book())) {
                throw new IllegalStateException(
                    "Licensed flat Bible book " + (bookIndex + 1)
                        + " does not match " + manifest.book()
                );
            }

            Set<String> omitted = new HashSet<>(manifest.omitted());
            int sourceLine = 1;
            for (int chapterIndex = 0;
                chapterIndex < manifest.chapterVerseCounts().size();
                chapterIndex++) {
                int chapter = chapterIndex + 1;
                int verseCount =
                    manifest.chapterVerseCounts().get(chapterIndex);
                for (int verse = 1; verse <= verseCount; verse++) {
                    String chapterVerse = chapter + ":" + verse;
                    String reference =
                        manifest.book() + "|" + chapterVerse;
                    if (omitted.contains(chapterVerse)
                        || MERGED_CONTINUATION_REFERENCES.contains(reference)) {
                        translations.put(referenceKey(
                            manifest.book(),
                            chapter,
                            verse
                        ), "");
                        continue;
                    }
                    if (sourceLine >= lines.size()) {
                        throw new IllegalStateException(
                            "Licensed flat Bible source ended during "
                                + manifest.book() + " " + chapterVerse
                        );
                    }
                    translations.put(referenceKey(
                        manifest.book(),
                        chapter,
                        verse
                    ), lines.get(sourceLine++));
                }
            }
            if (sourceLine != lines.size()) {
                throw new IllegalStateException(
                    "Licensed flat Bible source has "
                        + (lines.size() - sourceLine)
                        + " unmapped lines after " + manifest.book()
                );
            }
        }
        return translations;
    }

    private Map<String, String> loadJsonTranslations() throws Exception {
        Path booksFile = sourceDirectory.resolve("Books.json");
        if (!Files.isRegularFile(booksFile)) {
            throw new IllegalStateException(
                "Licensed Bible source is missing " + FLAT_SOURCE_FILE
                    + " or Books.json"
            );
        }

        JsonNode bookNames;
        try (InputStream input = Files.newInputStream(booksFile)) {
            bookNames = objectMapper.readTree(input);
        }
        Map<String, String> translations = new HashMap<>();
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
                    translations.put(referenceKey(
                        bookName,
                        chapterNumber,
                        verseNumber
                    ), translatedVerse.path("text").asText());
                }
            }
        }
        return translations;
    }

    private boolean matchesHeading(String sourceHeading, String bookName) {
        String normalizedSource = sourceHeading.replace("\uFEFF", "").trim()
            .toLowerCase(Locale.ROOT);
        String normalizedBook = bookName.trim().toLowerCase(Locale.ROOT);
        if (normalizedSource.equals(normalizedBook)) {
            return true;
        }
        if (normalizedBook.matches("^[123] .+")) {
            String ordinal = switch (normalizedBook.charAt(0)) {
                case '1' -> "st";
                case '2' -> "nd";
                case '3' -> "rd";
                default -> "";
            };
            return normalizedSource.equals(
                ordinal + normalizedBook.substring(1)
            );
        }
        return false;
    }

    private String referenceKey(Verse verse) {
        return referenceKey(
            verse.getChapter().getBook().getTitle(),
            verse.getChapter().getChapterNumber(),
            verse.getVerseNumber()
        );
    }

    private String referenceKey(String book, int chapter, int verse) {
        return book.trim().toLowerCase(Locale.ROOT)
            + "|" + chapter + "|" + verse;
    }

    private record FlatBibleBookManifest(
        String book,
        List<Integer> chapterVerseCounts,
        List<String> omitted
    ) {}
}
