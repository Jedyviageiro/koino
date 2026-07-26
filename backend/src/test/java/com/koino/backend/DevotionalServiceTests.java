package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.koino.backend.model.Book;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanPassage;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.model.UserTaskDevotional;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserTaskDevotionalRepository;
import com.koino.backend.repository.VerseRepository;
import com.koino.backend.service.DevotionalService;
import com.koino.backend.service.GeminiDevotionalClient;
import com.koino.backend.service.LocalDevotionalCatalog;
import com.koino.backend.service.LocalDevotionalCatalog.DevotionalTemplate;
import com.koino.backend.service.GeminiDevotionalClient.GeneratedDevotional;

class DevotionalServiceTests {

    @Test
    void generatesAndPersistsADevotionalFromTheAssignedBibleText() {
        Fixture fixture = fixture(LocalDate.now());
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.empty());
        when(fixture.taskRepository()
            .findOwnedTaskForDevotional(9L, 42L))
            .thenReturn(Optional.of(fixture.task()));
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.empty());
        when(fixture.verseRepository()
            .findByChapterChapterIdOrderByVerseNumber(3L))
            .thenReturn(List.of(fixture.verse()));
        when(fixture.geminiClient().generate(any())).thenReturn(
            new GeneratedDevotional(
                "A Kingdom Perspective",
                "Jesus invites us to see life differently.",
                "First reflection.\n\nSecond reflection.",
                "Carry this posture into the day.",
                "Lord, teach me to depend on you. Amen.",
                "gemini-2.5-flash"
            )
        );
        when(fixture.devotionalRepository().save(any()))
            .thenAnswer(invocation -> {
                UserTaskDevotional saved = invocation.getArgument(0);
                saved.setDevotionalId(15L);
                return saved;
            });

        var response = fixture.service().getOrCreate(42L, 9L);

        assertThat(response.devotionalId()).isEqualTo(15L);
        assertThat(response.anchorVerseReference()).isEqualTo("Matthew 5:3");
        assertThat(response.anchorVerseText())
            .isEqualTo("Blessed are the poor in spirit.");
        assertThat(response.verseCount()).isEqualTo(1);
        verify(fixture.geminiClient()).generate(
            contains("Matthew 5:3 Blessed are the poor in spirit.")
        );
        verify(fixture.devotionalRepository()).save(any(UserTaskDevotional.class));
    }

    @Test
    void returnsTheStoredDevotionalWithoutCallingGeminiAgain() {
        Fixture fixture = fixture(LocalDate.now());
        UserTaskDevotional stored = storedDevotional(fixture.task());
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.of(stored));

        var response = fixture.service().getOrCreate(42L, 9L);

        assertThat(response.title()).isEqualTo("Already prepared");
        verify(fixture.geminiClient(), never()).generate(any());
        verify(fixture.devotionalRepository(), never()).save(any());
    }

    @Test
    void reusesAnIdenticalReadingWithoutCallingGeminiAgain() {
        Fixture fixture = fixture(LocalDate.now());
        UserTaskDevotional reusable = storedDevotional(fixture.task());
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.empty());
        when(fixture.taskRepository().findOwnedTaskForDevotional(9L, 42L))
            .thenReturn(Optional.of(fixture.task()));
        when(fixture.devotionalRepository()
            .findFirstByTaskReadingAssignmentOrderByDevotionalIdAsc(
                "Matthew 5:3"
            ))
            .thenReturn(Optional.of(reusable));
        when(fixture.devotionalRepository().save(any()))
            .thenAnswer(invocation -> {
                UserTaskDevotional saved = invocation.getArgument(0);
                saved.setDevotionalId(16L);
                return saved;
            });

        var response = fixture.service().getOrCreate(42L, 9L);

        assertThat(response.devotionalId()).isEqualTo(16L);
        assertThat(response.title()).isEqualTo("Already prepared");
        verify(fixture.geminiClient(), never()).generate(any());
    }

    @Test
    void restoresADevotionalFromTheLocalCatalogBeforeCallingGemini() {
        Fixture fixture = fixture(LocalDate.now());
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.empty());
        when(fixture.taskRepository().findOwnedTaskForDevotional(9L, 42L))
            .thenReturn(Optional.of(fixture.task()));
        when(fixture.localCatalog().findByReadingAssignment("Matthew 5:3"))
            .thenReturn(Optional.of(new DevotionalTemplate(
                "Matthew 5:3",
                "Locally restored",
                "Matthew 5:3",
                "Blessed are the poor in spirit.",
                "Opening",
                "Reflection",
                "Application",
                "Prayer",
                "gemini-3.5-flash-lite"
            )));
        when(fixture.devotionalRepository().save(any()))
            .thenAnswer(invocation -> {
                UserTaskDevotional saved = invocation.getArgument(0);
                saved.setDevotionalId(17L);
                return saved;
            });

        var response = fixture.service().getOrCreate(42L, 9L);

        assertThat(response.devotionalId()).isEqualTo(17L);
        assertThat(response.title()).isEqualTo("Locally restored");
        verify(fixture.geminiClient(), never()).generate(any());
    }

    @Test
    void rejectsADevotionalForAFutureReading() {
        Fixture fixture = fixture(LocalDate.now().plusDays(1));
        when(fixture.devotionalRepository()
            .findByTaskTaskIdAndTaskActivePlanUserUserId(9L, 42L))
            .thenReturn(Optional.empty());
        when(fixture.taskRepository()
            .findOwnedTaskForDevotional(9L, 42L))
            .thenReturn(Optional.of(fixture.task()));

        assertThatThrownBy(() -> fixture.service().getOrCreate(42L, 9L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("locked until");
        verify(fixture.geminiClient(), never()).generate(any());
    }

    private Fixture fixture(LocalDate scheduledDate) {
        User user = new User();
        user.setUserId(42L);

        UserActivePlan activePlan = new UserActivePlan();
        activePlan.setUser(user);

        Book book = new Book();
        book.setBookId(1);
        book.setTitle("Matthew");

        Chapter chapter = new Chapter();
        chapter.setChapterId(3L);
        chapter.setBook(book);
        chapter.setChapterNumber(5);

        UserPlanTask task = new UserPlanTask();
        task.setTaskId(9L);
        task.setActivePlan(activePlan);
        task.setDayNumber(1);
        task.setScheduledDate(scheduledDate);
        task.setReadingAssignment("Matthew 5:3");
        task.setEstimatedMinutes(10);

        UserPlanPassage passage = new UserPlanPassage();
        passage.setTask(task);
        passage.setChapter(chapter);
        passage.setFirstVerse(3);
        passage.setLastVerse(3);
        passage.setPassageOrder(1);
        task.setPassages(List.of(passage));

        Verse verse = new Verse();
        verse.setVerseId(4L);
        verse.setChapter(chapter);
        verse.setVerseNumber(3);
        verse.setText("Blessed are the poor in spirit.");

        UserPlanTaskRepository taskRepository =
            mock(UserPlanTaskRepository.class);
        UserTaskDevotionalRepository devotionalRepository =
            mock(UserTaskDevotionalRepository.class);
        VerseRepository verseRepository = mock(VerseRepository.class);
        GeminiDevotionalClient geminiClient =
            mock(GeminiDevotionalClient.class);
        LocalDevotionalCatalog localCatalog =
            mock(LocalDevotionalCatalog.class);
        DevotionalService service = new DevotionalService(
            taskRepository,
            devotionalRepository,
            verseRepository,
            geminiClient,
            localCatalog
        );
        return new Fixture(
            service,
            taskRepository,
            devotionalRepository,
            verseRepository,
            geminiClient,
            localCatalog,
            task,
            verse
        );
    }

    private UserTaskDevotional storedDevotional(UserPlanTask task) {
        UserTaskDevotional devotional = new UserTaskDevotional();
        devotional.setDevotionalId(15L);
        devotional.setTask(task);
        devotional.setTitle("Already prepared");
        devotional.setAnchorVerseReference("Matthew 5:3");
        devotional.setAnchorVerseText("Blessed are the poor in spirit.");
        devotional.setOpening("Opening");
        devotional.setReflection("Reflection");
        devotional.setApplication("Application");
        devotional.setPrayer("Prayer");
        devotional.setModelName("gemini-2.5-flash");
        devotional.setGeneratedAt(Instant.now());
        return devotional;
    }

    private record Fixture(
        DevotionalService service,
        UserPlanTaskRepository taskRepository,
        UserTaskDevotionalRepository devotionalRepository,
        VerseRepository verseRepository,
        GeminiDevotionalClient geminiClient,
        LocalDevotionalCatalog localCatalog,
        UserPlanTask task,
        Verse verse
    ) {}
}
