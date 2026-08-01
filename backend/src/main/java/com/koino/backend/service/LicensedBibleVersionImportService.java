package com.koino.backend.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
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
    private static final String PORTABLE_JSON_FILE = "bible.json";
    private static final Map<String, String> PORTUGUESE_BOOK_NAMES = Map.ofEntries(
        Map.entry("genesis", "Genesis"), Map.entry("exodo", "Exodus"),
        Map.entry("levitico", "Leviticus"), Map.entry("numeros", "Numbers"),
        Map.entry("deuteronomio", "Deuteronomy"), Map.entry("josue", "Joshua"),
        Map.entry("juizes", "Judges"), Map.entry("rute", "Ruth"),
        Map.entry("1 reis", "1 Kings"), Map.entry("2 reis", "2 Kings"),
        Map.entry("1 cronicas", "1 Chronicles"), Map.entry("2 cronicas", "2 Chronicles"),
        Map.entry("esdras", "Ezra"), Map.entry("neemias", "Nehemiah"),
        Map.entry("ester", "Esther"), Map.entry("jo", "Job"),
        Map.entry("salmos", "Psalms"), Map.entry("proverbios", "Proverbs"),
        Map.entry("eclesiastes", "Ecclesiastes"), Map.entry("canticos", "Song of Solomon"),
        Map.entry("cantico dos canticos", "Song of Solomon"), Map.entry("isaias", "Isaiah"),
        Map.entry("lamentacoes", "Lamentations"), Map.entry("ezequiel", "Ezekiel"),
        Map.entry("oseias", "Hosea"), Map.entry("amos", "Amos"),
        Map.entry("obadias", "Obadiah"), Map.entry("jonas", "Jonah"),
        Map.entry("miqueias", "Micah"), Map.entry("naum", "Nahum"),
        Map.entry("habacuque", "Habakkuk"), Map.entry("sofonias", "Zephaniah"),
        Map.entry("ageu", "Haggai"), Map.entry("zacarias", "Zechariah"),
        Map.entry("malaquias", "Malachi"), Map.entry("mateus", "Matthew"),
        Map.entry("marcos", "Mark"), Map.entry("lucas", "Luke"),
        Map.entry("joao", "John"), Map.entry("atos", "Acts"),
        Map.entry("romanos", "Romans"), Map.entry("1 corintios", "1 Corinthians"),
        Map.entry("2 corintios", "2 Corinthians"), Map.entry("galatas", "Galatians"),
        Map.entry("efesios", "Ephesians"), Map.entry("filipenses", "Philippians"),
        Map.entry("colossenses", "Colossians"), Map.entry("1 tessalonicenses", "1 Thessalonians"),
        Map.entry("2 tessalonicenses", "2 Thessalonians"), Map.entry("1 timoteo", "1 Timothy"),
        Map.entry("2 timoteo", "2 Timothy"), Map.entry("tito", "Titus"),
        Map.entry("filemom", "Philemon"), Map.entry("hebreus", "Hebrews"),
        Map.entry("tiago", "James"), Map.entry("1 pedro", "1 Peter"),
        Map.entry("2 pedro", "2 Peter"), Map.entry("1 joao", "1 John"),
        Map.entry("2 joao", "2 John"), Map.entry("3 joao", "3 John"),
        Map.entry("judas", "Jude"), Map.entry("apocalipse", "Revelation")
    );
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
        Path portableJson = sourceDirectory.resolve(PORTABLE_JSON_FILE);
        if (Files.isRegularFile(portableJson)) {
            return loadPortableJsonTranslations(portableJson);
        }
        Path flatSource = sourceDirectory.resolve(FLAT_SOURCE_FILE);
        if (Files.isRegularFile(flatSource)) {
            return loadFlatTextTranslations(flatSource);
        }
        return loadJsonTranslations();
    }

    private Map<String, String> loadPortableJsonTranslations(Path source)
        throws Exception {
        List<PortableBibleVerse> verses;
        try (InputStream input = Files.newInputStream(source)) {
            verses = objectMapper.readValue(input, new TypeReference<>() {});
        }
        Map<String, String> translations = new HashMap<>();
        for (PortableBibleVerse verse : verses) {
            if (verse.book() == null || verse.text() == null
                || verse.chapter() < 1 || verse.verse() < 1) {
                throw new IllegalStateException(
                    "Licensed Bible JSON contains an invalid verse"
                );
            }
            String key = referenceKey(
                canonicalBookName(verse.book()),
                verse.chapter(),
                verse.verse()
            );
            if (translations.putIfAbsent(key, verse.text()) != null) {
                throw new IllegalStateException(
                    "Licensed Bible JSON contains duplicate reference " + key
                );
            }
        }
        return translations;
    }

    private String canonicalBookName(String book) {
        String normalized = Normalizer.normalize(book.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT);
        return PORTUGUESE_BOOK_NAMES.getOrDefault(normalized, book.trim());
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

    private record PortableBibleVerse(
        String book,
        int chapter,
        int verse,
        String text
    ) {}
}
