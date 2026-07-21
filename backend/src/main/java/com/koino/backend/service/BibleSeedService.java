package com.koino.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.BookRepository;
import com.koino.backend.repository.ChapterRepository;
import com.koino.backend.repository.VerseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;

@Service
public class BibleSeedService implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final VerseRepository verseRepository;

    public BibleSeedService(BookRepository bookRepository, ChapterRepository chapterRepository, VerseRepository verseRepository) {
        this.bookRepository = bookRepository;
        this.chapterRepository = chapterRepository;
        this.verseRepository = verseRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Only seed if the books table is empty
        if (bookRepository.count() == 0) {
            System.out.println(">>> Seeding database with real Bible data from public repository...");

            // Using a standard public domain JSON Bible source (e.g., World English Bible / KJV format)
            String jsonUrl = "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json";
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootArray = mapper.readTree(new URL(jsonUrl));

            int bookOrder = 1;
            for (JsonNode bookNode : rootArray) {
                String bookName = bookNode.get("name").asText();

                // 1. Create and Save Book
                Book book = new Book();
                book.setTitle(bookName);
                book.setOrderIndex(bookOrder++);
                book = bookRepository.save(book);

                // 2. Iterate through Chapters (represented as an array of arrays)
                JsonNode chaptersArray = bookNode.get("chapters");
                int chapterNum = 1;
                
                for (JsonNode chapterNode : chaptersArray) {
                    Chapter chapter = new Chapter();
                    chapter.setBook(book);
                    chapter.setChapterNumber(chapterNum);
                    chapter.setVerseCount(chapterNode.size());
                    chapter = chapterRepository.save(chapter);

                    // 3. Iterate through Verses
                    int verseNum = 1;
                    for (JsonNode verseNode : chapterNode) {
                        Verse verse = new Verse();
                        verse.setChapter(chapter);
                        verse.setVerseNumber(verseNum++);
                        verse.setText(verseNode.asText());
                        
                        verseRepository.save(verse);
                    }
                    chapterNum++;
                }
            }
            System.out.println(">>> Bible seeding completed successfully! All books, chapters, and verses are stored in PostgreSQL.");
        }
    }
}