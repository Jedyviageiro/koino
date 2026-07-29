package com.koino.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.repository.BookRepository;
import com.koino.backend.repository.ChapterRepository;
import com.koino.backend.repository.VerseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Order(10)
public class BibleSeedService implements CommandLineRunner {
    private static final int BATCH_SIZE = 1_000;

    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final VerseRepository verseRepository;
    private final JdbcTemplate jdbcTemplate;

    public BibleSeedService(
        BookRepository bookRepository,
        ChapterRepository chapterRepository,
        VerseRepository verseRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.bookRepository = bookRepository;
        this.chapterRepository = chapterRepository;
        this.verseRepository = verseRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        JsonNode bible = loadBundledBible();
        SeedCounts expected = countExpectedRows(bible);
        if (hasExpectedRows(expected)) {
            return;
        }

        System.out.println(">>> Repairing bundled KJV Bible data...");
        seedBooks(bible);
        Map<String, Integer> bookIds = loadBookIds();
        seedChapters(bible, bookIds);
        Map<String, Long> chapterIds = loadChapterIds();
        seedVerses(bible, chapterIds);

        if (!hasExpectedRows(expected)) {
            throw new IllegalStateException(
                "Bible initialization did not complete. Expected " +
                expected.books() + " books, " + expected.chapters() +
                " chapters, and " + expected.verses() + " verses."
            );
        }
        System.out.println(">>> Bible data is ready.");
    }

    private JsonNode loadBundledBible() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream input = new ClassPathResource(
            "bible/en_kjv.json"
        ).getInputStream()) {
            return mapper.readTree(input);
        }
    }

    private SeedCounts countExpectedRows(JsonNode bible) {
        int chapters = 0;
        int verses = 0;
        for (JsonNode bookNode : bible) {
            JsonNode chapterNodes = bookNode.get("chapters");
            chapters += chapterNodes.size();
            for (JsonNode chapterNode : chapterNodes) {
                verses += chapterNode.size();
            }
        }
        return new SeedCounts(bible.size(), chapters, verses);
    }

    private boolean hasExpectedRows(SeedCounts expected) {
        return bookRepository.count() == expected.books()
            && chapterRepository.count() == expected.chapters()
            && verseRepository.count() == expected.verses();
    }

    private void seedBooks(JsonNode bible) {
        List<BookSeed> books = new ArrayList<>(bible.size());
        int orderIndex = 1;
        for (JsonNode bookNode : bible) {
            books.add(new BookSeed(bookNode.get("name").asText(), orderIndex++));
        }
        jdbcTemplate.batchUpdate(
            """
            insert into books (title, order_index)
            values (?, ?)
            on conflict do nothing
            """,
            books,
            BATCH_SIZE,
            (statement, book) -> {
                statement.setString(1, book.title());
                statement.setInt(2, book.orderIndex());
            }
        );
    }

    private Map<String, Integer> loadBookIds() {
        Map<String, Integer> ids = new HashMap<>();
        jdbcTemplate.query(
            "select book_id, title from books",
            (RowCallbackHandler) result ->
                ids.put(result.getString("title"), result.getInt("book_id"))
        );
        return ids;
    }

    private void seedChapters(
        JsonNode bible,
        Map<String, Integer> bookIds
    ) {
        List<ChapterSeed> chapters = new ArrayList<>();
        for (JsonNode bookNode : bible) {
            String bookTitle = bookNode.get("name").asText();
            Integer bookId = bookIds.get(bookTitle);
            if (bookId == null) {
                throw new IllegalStateException(
                    "Bible book could not be initialized: " + bookTitle
                );
            }
            int chapterNumber = 1;
            for (JsonNode chapterNode : bookNode.get("chapters")) {
                chapters.add(new ChapterSeed(
                    bookId,
                    chapterNumber++,
                    chapterNode.size()
                ));
            }
        }
        jdbcTemplate.batchUpdate(
            """
            insert into chapters (book_id, chapter_number, verse_count)
            values (?, ?, ?)
            on conflict do nothing
            """,
            chapters,
            BATCH_SIZE,
            (statement, chapter) -> {
                statement.setInt(1, chapter.bookId());
                statement.setInt(2, chapter.chapterNumber());
                statement.setInt(3, chapter.verseCount());
            }
        );
    }

    private Map<String, Long> loadChapterIds() {
        Map<String, Long> ids = new HashMap<>();
        jdbcTemplate.query(
            """
            select c.chapter_id, c.chapter_number, b.title
            from chapters c
            join books b on b.book_id = c.book_id
            """,
            (RowCallbackHandler) result -> ids.put(
                chapterKey(
                    result.getString("title"),
                    result.getInt("chapter_number")
                ),
                result.getLong("chapter_id")
            )
        );
        return ids;
    }

    private void seedVerses(
        JsonNode bible,
        Map<String, Long> chapterIds
    ) {
        List<VerseSeed> verses = new ArrayList<>();
        for (JsonNode bookNode : bible) {
            String bookTitle = bookNode.get("name").asText();
            int chapterNumber = 1;
            for (JsonNode chapterNode : bookNode.get("chapters")) {
                Long chapterId = chapterIds.get(
                    chapterKey(bookTitle, chapterNumber++)
                );
                if (chapterId == null) {
                    throw new IllegalStateException(
                        "Bible chapter could not be initialized: " +
                        bookTitle + " " + (chapterNumber - 1)
                    );
                }
                int verseNumber = 1;
                for (JsonNode verseNode : chapterNode) {
                    verses.add(new VerseSeed(
                        chapterId,
                        verseNumber++,
                        BibleTextCleaner.clean(verseNode.asText())
                    ));
                }
            }
        }
        jdbcTemplate.batchUpdate(
            """
            insert into verses (chapter_id, verse_number, text)
            values (?, ?, ?)
            on conflict do nothing
            """,
            verses,
            BATCH_SIZE,
            (statement, verse) -> {
                statement.setLong(1, verse.chapterId());
                statement.setInt(2, verse.verseNumber());
                statement.setString(3, verse.text());
            }
        );
    }

    private String chapterKey(String bookTitle, int chapterNumber) {
        return bookTitle + ":" + chapterNumber;
    }

    private record BookSeed(String title, int orderIndex) {}

    private record ChapterSeed(
        int bookId,
        int chapterNumber,
        int verseCount
    ) {}

    private record VerseSeed(
        long chapterId,
        int verseNumber,
        String text
    ) {}

    private record SeedCounts(int books, int chapters, int verses) {}
}
