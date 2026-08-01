package com.koino.backend.service;

import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.BibleVerseText;
import com.koino.backend.model.BibleVersion;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BibleVerseTextRepository;
import com.koino.backend.repository.BibleVersionRepository;
import com.koino.backend.repository.VerseRepository;

@Service
@Order(22)
public class LicensedSqlBibleImportService implements CommandLineRunner {
    private static final Logger LOGGER = LoggerFactory.getLogger(
        LicensedSqlBibleImportService.class
    );
    private static final int MINIMUM_COMPLETE_VERSES = 30_000;

    private final BibleVersionRepository versionRepository;
    private final BibleVerseTextRepository verseTextRepository;
    private final VerseRepository verseRepository;
    private final boolean enabled;
    private final boolean rightsConfirmed;
    private final Path sourceDirectory;
    private final String nivCopyright;
    private final String nviCopyright;

    public LicensedSqlBibleImportService(
        BibleVersionRepository versionRepository,
        BibleVerseTextRepository verseTextRepository,
        VerseRepository verseRepository,
        @Value("${bible.sql-import.enabled:false}") boolean enabled,
        @Value("${bible.licensed-import.rights-confirmed:false}")
            boolean rightsConfirmed,
        @Value("${bible.sql-import.source-directory:/app/data/licensed-bibles}")
            String sourceDirectory,
        @Value("${bible.sql-import.niv-copyright:}") String nivCopyright,
        @Value("${bible.sql-import.nvi-copyright:}") String nviCopyright
    ) {
        this.versionRepository = versionRepository;
        this.verseTextRepository = verseTextRepository;
        this.verseRepository = verseRepository;
        this.enabled = enabled;
        this.rightsConfirmed = rightsConfirmed;
        this.sourceDirectory = Path.of(sourceDirectory);
        this.nivCopyright = nivCopyright.trim();
        this.nviCopyright = nviCopyright.trim();
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }
        if (!rightsConfirmed) {
            throw new IllegalStateException(
                "SQL Bible import requires confirmed redistribution rights"
            );
        }

        List<Verse> canonicalVerses = verseRepository.findAllWithReference();
        Map<Reference, Verse> canonicalByReference = new HashMap<>();
        for (Verse verse : canonicalVerses) {
            canonicalByReference.put(new Reference(
                verse.getChapter().getBook().getOrderIndex() - 1,
                verse.getChapter().getChapterNumber(),
                verse.getVerseNumber()
            ), verse);
        }

        importSource(
            new SqlSource(
                "NIV",
                "New International Version",
                sourceDirectory.resolve("bible-en-niv.sql"),
                nivCopyright,
                SqlShape.MULTI_VERSION
            ),
            canonicalByReference
        );
        importSource(
            new SqlSource(
                "NVI",
                "Nova Versão Internacional",
                sourceDirectory.resolve("bible-pt-nvi.sql"),
                nviCopyright,
                SqlShape.NVI
            ),
            canonicalByReference
        );
    }

    private void importSource(
        SqlSource source,
        Map<Reference, Verse> canonicalByReference
    ) throws Exception {
        if (!Files.isRegularFile(source.path())) {
            throw new IllegalStateException(
                "Licensed Bible source is missing: " + source.path()
            );
        }
        if (source.copyright().isBlank()) {
            throw new IllegalStateException(
                source.code() + " import requires its exact copyright notice"
            );
        }

        BibleVersion version = versionRepository.findById(source.code())
            .orElseGet(BibleVersion::new);
        List<BibleVerseText> stored = verseTextRepository
            .findByVersionCode(source.code());
        if (version.isEnabled() && stored.size() >= MINIMUM_COMPLETE_VERSES) {
            updateVersion(version, source, true);
            versionRepository.save(version);
            LOGGER.info("{} is already imported with {} verse rows", source.code(), stored.size());
            return;
        }

        updateVersion(version, source, false);
        versionRepository.save(version);
        Map<Reference, String> sourceTexts = readSource(source);
        if (sourceTexts.size() < MINIMUM_COMPLETE_VERSES) {
            throw new IllegalStateException(
                source.code() + " SQL source resolved only "
                    + sourceTexts.size() + " verses"
            );
        }

        Map<Long, BibleVerseText> existingByVerse = new HashMap<>();
        for (BibleVerseText text : stored) {
            existingByVerse.put(text.getVerse().getVerseId(), text);
        }
        List<BibleVerseText> imports = new ArrayList<>(sourceTexts.size());
        int unmatched = 0;
        for (Map.Entry<Reference, String> entry : sourceTexts.entrySet()) {
            Verse canonical = canonicalByReference.get(entry.getKey());
            if (canonical == null) {
                unmatched++;
                continue;
            }
            BibleVerseText text = existingByVerse.getOrDefault(
                canonical.getVerseId(),
                new BibleVerseText()
            );
            text.setVersion(version);
            text.setVerse(canonical);
            text.setText(BibleTextCleaner.clean(entry.getValue()));
            imports.add(text);
        }
        verseTextRepository.saveAll(imports);
        updateVersion(version, source, true);
        versionRepository.save(version);
        LOGGER.info(
            "Imported {} {} verses from {} ({} unmatched source rows)",
            imports.size(), source.code(), source.path(), unmatched
        );
    }

    private Map<Reference, String> readSource(SqlSource source) throws Exception {
        Map<Reference, String> verses = new HashMap<>(32_000);
        try (BufferedReader reader = Files.newBufferedReader(
            source.path(), StandardCharsets.UTF_8
        )) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (source.shape() == SqlShape.MULTI_VERSION) {
                    readMultiVersionLine(line, verses);
                } else {
                    readNviLine(line, verses);
                }
            }
        }
        return verses;
    }

    private void readMultiVersionLine(
        String line,
        Map<Reference, String> verses
    ) {
        if (!line.startsWith("INSERT INTO super_bible VALUES(")) {
            return;
        }
        List<String> values = parseValues(line);
        if (values.size() != 8
            || !"NIV".equalsIgnoreCase(values.get(6))
            || !"EN".equalsIgnoreCase(values.get(7))) {
            return;
        }
        verses.put(new Reference(
            Integer.parseInt(values.get(1)) - 1,
            Integer.parseInt(values.get(3)),
            Integer.parseInt(values.get(4))
        ), values.get(5));
    }

    private void readNviLine(String line, Map<Reference, String> verses) {
        if (!line.startsWith("INSERT INTO public.verses ")) {
            return;
        }
        List<String> values = parseValues(line);
        if (values.size() != 6 || !"nvi".equalsIgnoreCase(values.get(1))) {
            return;
        }
        verses.put(new Reference(
            Integer.parseInt(values.get(5)),
            Integer.parseInt(values.get(2)),
            Integer.parseInt(values.get(3))
        ), values.get(4));
    }

    static List<String> parseValues(String statement) {
        int start = statement.indexOf("VALUES (");
        if (start < 0) {
            start = statement.indexOf("VALUES(");
        }
        if (start < 0) {
            return List.of();
        }
        start = statement.indexOf('(', start) + 1;
        int end = statement.lastIndexOf(");");
        if (end < start) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean quoted = false;
        for (int index = start; index < end; index++) {
            char current = statement.charAt(index);
            if (current == '\'' && quoted && index + 1 < end
                && statement.charAt(index + 1) == '\'') {
                value.append('\'');
                index++;
            } else if (current == '\'') {
                quoted = !quoted;
            } else if (current == ',' && !quoted) {
                values.add(value.toString().trim());
                value.setLength(0);
            } else {
                value.append(current);
            }
        }
        values.add(value.toString().trim());
        return values;
    }

    private void updateVersion(
        BibleVersion version,
        SqlSource source,
        boolean enabled
    ) {
        version.setCode(source.code());
        version.setName(source.name());
        version.setCopyrightNotice(source.copyright());
        version.setEnabled(enabled);
    }

    private enum SqlShape { MULTI_VERSION, NVI }

    private record Reference(int bookIndex, int chapter, int verse) {}

    private record SqlSource(
        String code,
        String name,
        Path path,
        String copyright,
        SqlShape shape
    ) {}
}
