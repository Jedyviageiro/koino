package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cloudinary.Cloudinary;
import com.koino.backend.dto.community.CreateCommunityPostRequest;
import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.CommunityComment;
import com.koino.backend.model.CommunityPost;
import com.koino.backend.model.CommunityPostType;
import com.koino.backend.model.User;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.CommunityCommentRepository;
import com.koino.backend.repository.CommunityPostRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.repository.VerseRepository;
import com.koino.backend.service.CommunityService;
import com.koino.backend.service.ContentModerationService;
import com.koino.backend.service.TrustSafetyService;

class CommunityServiceTests {

    @Test
    void createsVersePostFromCanonicalBibleVerse() {
        Fixture fixture = fixture();
        Verse verse = matthewFiveEight();
        when(fixture.verseRepository().findById(100L))
            .thenReturn(Optional.of(verse));
        when(fixture.postRepository().save(any()))
            .thenAnswer(invocation -> {
                CommunityPost post = invocation.getArgument(0);
                post.setPostId(9L);
                post.setCreatedAt(LocalDateTime.now());
                return post;
            });

        var result = fixture.service().createPost(
            42L,
            new CreateCommunityPostRequest(
                CommunityPostType.VERSE,
                100L,
                "This encouraged me today."
            )
        );

        assertThat(result.postId()).isEqualTo(9L);
        assertThat(result.verse().reference()).isEqualTo("Matthew 5:8");
        assertThat(result.verse().text())
            .isEqualTo("Blessed are the pure in heart.");
        verify(fixture.postRepository()).save(any(CommunityPost.class));
    }

    @Test
    void rejectsQuestionWithoutContent() {
        Fixture fixture = fixture();

        assertThatThrownBy(() -> fixture.service().createPost(
            42L,
            new CreateCommunityPostRequest(
                CommunityPostType.QUESTION,
                null,
                "  "
            )
        ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Write your question before posting");
    }

    @Test
    void addsCommentToExistingPost() {
        Fixture fixture = fixture();
        CommunityPost post = new CommunityPost();
        post.setPostId(9L);
        when(fixture.postRepository().findById(9L))
            .thenReturn(Optional.of(post));
        when(fixture.commentRepository().save(any()))
            .thenAnswer(invocation -> {
                CommunityComment comment = invocation.getArgument(0);
                comment.setCommentId(12L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });

        var result = fixture.service().addComment(
            42L,
            9L,
            "Thank you for sharing."
        );

        assertThat(result.commentId()).isEqualTo(12L);
        assertThat(result.content()).isEqualTo("Thank you for sharing.");
        assertThat(result.author().fullname()).isEqualTo("Maria Santos");
    }

    private Fixture fixture() {
        CommunityPostRepository postRepository =
            mock(CommunityPostRepository.class);
        CommunityCommentRepository commentRepository =
            mock(CommunityCommentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        VerseRepository verseRepository = mock(VerseRepository.class);
        User user = new User();
        user.setUserId(42L);
        user.setFullname("Maria Santos");
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        CommunityService service = new CommunityService(
            postRepository,
            commentRepository,
            userRepository,
            verseRepository,
            mock(Cloudinary.class),
            mock(TrustSafetyService.class),
            mock(ContentModerationService.class)
        );
        return new Fixture(
            service,
            postRepository,
            commentRepository,
            verseRepository
        );
    }

    private Verse matthewFiveEight() {
        Book book = new Book();
        book.setTitle("Matthew");
        Chapter chapter = new Chapter();
        chapter.setChapterNumber(5);
        chapter.setBook(book);
        Verse verse = new Verse();
        verse.setVerseId(100L);
        verse.setChapter(chapter);
        verse.setVerseNumber(8);
        verse.setText("Blessed are the pure in heart.");
        return verse;
    }

    private record Fixture(
        CommunityService service,
        CommunityPostRepository postRepository,
        CommunityCommentRepository commentRepository,
        VerseRepository verseRepository
    ) {
    }
}
