package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.koino.backend.dto.user.VerseBookmarkResponse;
import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.User;
import com.koino.backend.model.Verse;
import com.koino.backend.model.VerseBookmark;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.repository.VerseBookmarkRepository;
import com.koino.backend.repository.VerseRepository;
import com.koino.backend.service.VerseBookmarkService;

class VerseBookmarkServiceTests {

    @Test
    void bookmarksExistingBibleVerse() {
        VerseBookmarkRepository bookmarkRepository = mock(VerseBookmarkRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        VerseRepository verseRepository = mock(VerseRepository.class);
        User user = new User();
        user.setUserId(42L);
        Verse verse = matthewFiveEight();

        when(bookmarkRepository.findByUserUserIdAndVerseVerseId(42L, 100L))
            .thenReturn(Optional.empty());
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(verseRepository.findById(100L)).thenReturn(Optional.of(verse));
        when(bookmarkRepository.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer(invocation -> {
                VerseBookmark bookmark = invocation.getArgument(0);
                bookmark.setBookmarkId(7L);
                return bookmark;
            });

        VerseBookmarkResponse result = service(
            bookmarkRepository, userRepository, verseRepository
        ).addBookmark(42L, 100L);

        assertThat(result.bookmarkId()).isEqualTo(7L);
        assertThat(result.book()).isEqualTo("Matthew");
        assertThat(result.chapterNumber()).isEqualTo(5);
        assertThat(result.verseNumber()).isEqualTo(8);
        assertThat(result.text()).isEqualTo("Blessed are the pure in heart.");
        assertThat(result.bookmarkedAt()).isNotNull();
    }

    @Test
    void removesOnlyBookmarkOwnedByCurrentUser() {
        VerseBookmarkRepository bookmarkRepository = mock(VerseBookmarkRepository.class);
        VerseBookmark bookmark = new VerseBookmark();
        bookmark.setCreatedAt(Instant.now());
        when(bookmarkRepository.findByUserUserIdAndVerseVerseId(42L, 100L))
            .thenReturn(Optional.of(bookmark));

        service(
            bookmarkRepository,
            mock(UserRepository.class),
            mock(VerseRepository.class)
        ).removeBookmark(42L, 100L);

        verify(bookmarkRepository).delete(bookmark);
    }

    private VerseBookmarkService service(
        VerseBookmarkRepository bookmarkRepository,
        UserRepository userRepository,
        VerseRepository verseRepository
    ) {
        return new VerseBookmarkService(bookmarkRepository, userRepository, verseRepository);
    }

    private Verse matthewFiveEight() {
        Book book = new Book();
        book.setTitle("Matthew");
        Chapter chapter = new Chapter();
        chapter.setChapterId(40L);
        chapter.setChapterNumber(5);
        chapter.setBook(book);
        Verse verse = new Verse();
        verse.setVerseId(100L);
        verse.setChapter(chapter);
        verse.setVerseNumber(8);
        verse.setText("Blessed are the pure in heart.");
        return verse;
    }
}
