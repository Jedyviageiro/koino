package com.koino.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koino.backend.model.Chapter;
import com.koino.backend.model.PlanTemplate;
import com.koino.backend.model.User;
import com.koino.backend.model.UserActivePlan;
import com.koino.backend.model.UserPlanTask;
import com.koino.backend.repository.ChapterRepository;
import com.koino.backend.repository.PlanTemplateRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserPlanTaskRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class PlanGenerationService implements CommandLineRunner {

    private static final String CATALOG_PATH = "reading-plans/reading-plan-catalog.json";
    private static final Set<String> TEACHING_PLAN_CHAPTERS = Set.of(
        "Matthew:5", "Matthew:6", "Matthew:7",
        "Luke:6", "Luke:10", "Luke:15",
        "John:3", "John:6", "John:10",
        "John:13", "John:14", "John:15"
    );
    private static final Set<Integer> SELECTED_PSALMS = Set.of(
        1, 8, 19, 23, 27, 46, 51, 91, 103, 139
    );

    private final UserRepository userRepository;
    private final PlanTemplateRepository planTemplateRepository;
    private final UserActivePlanRepositor activePlanRepository;
    private final UserPlanTaskRepository taskRepository;
    private final ChapterRepository chapterRepository;
    private final Map<String, PlanDefinition> plansById;
    private final List<ScenarioRoute> scenarioRoutes;

    public PlanGenerationService(
        UserRepository userRepository,
        PlanTemplateRepository planTemplateRepository,
        UserActivePlanRepositor activePlanRepository,
        UserPlanTaskRepository taskRepository,
        ChapterRepository chapterRepository
    ) {
        this.userRepository = userRepository;
        this.planTemplateRepository = planTemplateRepository;
        this.activePlanRepository = activePlanRepository;
        this.taskRepository = taskRepository;
        this.chapterRepository = chapterRepository;

        PlanCatalog catalog = loadCatalog();
        this.plansById = catalog.plans().stream().collect(Collectors.toUnmodifiableMap(
            PlanDefinition::id,
            Function.identity()
        ));
        this.scenarioRoutes = List.copyOf(catalog.scenarioRoutes());
    }

    @Override
    @Transactional
    public void run(String... args) {
        plansById.values().stream()
            .sorted((left, right) -> left.id().compareTo(right.id()))
            .forEach(this::getOrCreateTemplate);
    }

    @Transactional
    public void generateInitialPlan(
        Long userId,
        String journeyDescription,
        String preferredStartingPoint,
        int dailyCapacityMinutes,
        String workPace
    ) {
        RouteEntry firstPlan = resolveRoute(
            journeyDescription,
            preferredStartingPoint
        ).getFirst();

        generatePlan(
            userId,
            firstPlan.planId(),
            firstPlan.sequenceNumber(),
            dailyCapacityMinutes,
            workPace,
            LocalDate.now()
        );
    }

    @Transactional
    public void generateNextPlan(
        Long userId,
        String journeyDescription,
        String preferredStartingPoint,
        int dailyCapacityMinutes,
        String workPace,
        String completedPlanId
    ) {
        List<RouteEntry> route = resolveRoute(
            journeyDescription,
            preferredStartingPoint
        );
        int completedPlanIndex = findPlanIndex(route, completedPlanId);

        UserActivePlan completedPlan = activePlanRepository
            .findTopByUserUserIdAndPlanTemplatePlanCodeOrderByPlanSequenceNumberDesc(
                userId,
                completedPlanId
            )
            .orElseThrow(() -> new IllegalArgumentException(
                "The completed plan was not found for this user."
            ));

        if (!completedPlan.isCompleted()) {
            throw new IllegalStateException(
                "The current plan must be completed before the next plan is generated."
            );
        }

        int nextPlanIndex = completedPlanIndex + 1;
        if (nextPlanIndex >= route.size()) {
            return;
        }

        RouteEntry nextPlan = route.get(nextPlanIndex);
        generatePlan(
            userId,
            nextPlan.planId(),
            nextPlan.sequenceNumber(),
            dailyCapacityMinutes,
            workPace,
            LocalDate.now().plusDays(1)
        );
    }

    private void generatePlan(
        Long userId,
        String planId,
        int planSequenceNumber,
        int dailyCapacityMinutes,
        String workPace,
        LocalDate startingDate
    ) {
        if (activePlanRepository.existsByUserUserIdAndPlanTemplatePlanCode(userId, planId)) {
            return;
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID " + userId));
        PlanDefinition definition = getPlanDefinition(planId);
        int capacity = normalizeCapacity(dailyCapacityMinutes);
        PaceVariant pace = getPaceVariant(definition, capacity);
        PlanTemplate template = getOrCreateTemplate(definition);
        List<Chapter> chapters = resolveChapters(definition);

        UserActivePlan activePlan = new UserActivePlan();
        activePlan.setUser(user);
        activePlan.setPlanTemplate(template);
        activePlan.setPlanSequenceNumber(planSequenceNumber);
        activePlan.setStartDate(normalizeScheduleDate(startingDate, workPace));
        activePlan.setCompleted(false);
        activePlan = activePlanRepository.save(activePlan);

        List<String> assignments = createReadingAssignments(chapters, pace.durationDays());
        List<UserPlanTask> tasks = new ArrayList<>(assignments.size());
        LocalDate scheduledDate = activePlan.getStartDate();

        for (int index = 0; index < assignments.size(); index++) {
            UserPlanTask task = new UserPlanTask();
            task.setActivePlan(activePlan);
            task.setDayNumber(index + 1);
            task.setScheduledDate(scheduledDate);
            task.setReadingAssignment(assignments.get(index));
            task.setCompleted(false);
            tasks.add(task);
            scheduledDate = getNextScheduleDate(scheduledDate, workPace);
        }

        taskRepository.saveAll(tasks);
    }

    private PlanTemplate getOrCreateTemplate(PlanDefinition definition) {
        return planTemplateRepository.findByPlanCode(definition.id())
            .orElseGet(() -> planTemplateRepository.findByName(definition.name())
                .map(template -> updateTemplate(template, definition))
                .orElseGet(() -> updateTemplate(new PlanTemplate(), definition)));
    }

    private PlanTemplate updateTemplate(
        PlanTemplate template,
        PlanDefinition definition
    ) {
        PaceVariant standardPace = getPaceVariant(definition, 20);
        template.setPlanCode(definition.id());
        template.setName(definition.name());
        template.setDescription(definition.description());
        template.setDifficulty(definition.difficulty());
        template.setDurationDays(standardPace.durationDays());
        template.setTotalChapters(definition.totalChapters());
        template.setBookNames(String.join(", ", definition.bookNames()));
        template.setEstimatedMinutesPerDay(standardPace.estimatedMinutesPerDay());
        template.setTargetTag(definition.difficulty());
        return planTemplateRepository.save(template);
    }

    private List<Chapter> resolveChapters(PlanDefinition definition) {
        List<Chapter> chapters = switch (definition.id()) {
            case "P02" -> chapterRepository
                .findByBookTitlesInCanonicalOrder(List.of("Matthew", "Luke", "John"))
                .stream()
                .filter(chapter -> TEACHING_PLAN_CHAPTERS.contains(chapterKey(chapter)))
                .toList();
            case "P09" -> chapterRepository.findCanonicalRange(40, 66);
            case "P10" -> chapterRepository
                .findByBookTitlesInCanonicalOrder(List.of("Genesis", "Psalms"))
                .stream()
                .filter(chapter ->
                    "Genesis".equals(chapter.getBook().getTitle()) ||
                    SELECTED_PSALMS.contains(chapter.getChapterNumber())
                )
                .toList();
            case "P16" -> chapterRepository.findCanonicalRange(1, 39);
            case "P17", "P18" -> chapterRepository.findCanonicalRange(1, 66);
            default -> chapterRepository.findByBookTitlesInCanonicalOrder(
                normalizeBookTitles(definition.bookNames())
            );
        };

        if (chapters.size() != definition.totalChapters()) {
            throw new IllegalStateException(
                "Plan " + definition.id() + " expected " + definition.totalChapters() +
                " chapters but resolved " + chapters.size() + "."
            );
        }

        return chapters;
    }

    private List<String> createReadingAssignments(List<Chapter> chapters, int durationDays) {
        int totalVerses = chapters.stream()
            .mapToInt(chapter -> chapter.getVerseCount() == null ? 0 : chapter.getVerseCount())
            .sum();

        if (totalVerses == 0) {
            throw new IllegalStateException("The selected plan has no verse data.");
        }

        int taskCount = Math.min(durationDays, totalVerses);
        int baseVersesPerTask = totalVerses / taskCount;
        int remainder = totalVerses % taskCount;
        ReadingCursor cursor = new ReadingCursor();
        List<String> assignments = new ArrayList<>(taskCount);

        for (int day = 0; day < taskCount; day++) {
            int versesForDay = baseVersesPerTask + (day < remainder ? 1 : 0);
            assignments.add(readVerses(chapters, cursor, versesForDay));
        }

        return assignments;
    }

    private String readVerses(
        List<Chapter> chapters,
        ReadingCursor cursor,
        int requestedVerses
    ) {
        Map<String, List<String>> segmentsByBook = new LinkedHashMap<>();
        int remaining = requestedVerses;

        while (remaining > 0 && cursor.chapterIndex < chapters.size()) {
            Chapter chapter = chapters.get(cursor.chapterIndex);
            int verseCount = chapter.getVerseCount();
            int available = verseCount - cursor.verseNumber + 1;
            int take = Math.min(available, remaining);
            int firstVerse = cursor.verseNumber;
            int lastVerse = firstVerse + take - 1;
            String bookTitle = chapter.getBook().getTitle();

            segmentsByBook.computeIfAbsent(bookTitle, ignored -> new ArrayList<>())
                .add(formatChapterSegment(chapter, firstVerse, lastVerse));

            remaining -= take;
            cursor.verseNumber = lastVerse + 1;
            if (cursor.verseNumber > verseCount) {
                cursor.chapterIndex++;
                cursor.verseNumber = 1;
            }
        }

        return segmentsByBook.entrySet().stream()
            .map(entry -> entry.getKey() + " " + String.join("; ", entry.getValue()))
            .collect(Collectors.joining("; "));
    }

    private String formatChapterSegment(Chapter chapter, int firstVerse, int lastVerse) {
        int chapterNumber = chapter.getChapterNumber();
        if (firstVerse == 1 && lastVerse == chapter.getVerseCount()) {
            return Integer.toString(chapterNumber);
        }
        if (firstVerse == lastVerse) {
            return chapterNumber + ":" + firstVerse;
        }
        return chapterNumber + ":" + firstVerse + "-" + lastVerse;
    }

    private List<RouteEntry> resolveRoute(
        String journeyDescription,
        String preferredStartingPoint
    ) {
        return scenarioRoutes.stream()
            .filter(route -> route.journeyDescription().equalsIgnoreCase(journeyDescription))
            .filter(route -> route.preferredStartingPoint().equalsIgnoreCase(preferredStartingPoint))
            .findFirst()
            .map(ScenarioRoute::route)
            .orElseThrow(() -> new IllegalArgumentException(
                "No route was configured for journey " + journeyDescription +
                " and starting point " + preferredStartingPoint
            ));
    }

    private int findPlanIndex(List<RouteEntry> route, String planId) {
        for (int index = 0; index < route.size(); index++) {
            if (route.get(index).planId().equalsIgnoreCase(planId)) {
                return index;
            }
        }
        throw new IllegalArgumentException(
            "The completed plan does not belong to the user's route."
        );
    }

    private PlanDefinition getPlanDefinition(String planId) {
        PlanDefinition definition = plansById.get(planId);
        if (definition == null) {
            throw new IllegalArgumentException("Unknown plan: " + planId);
        }
        return definition;
    }

    private PaceVariant getPaceVariant(PlanDefinition definition, int capacity) {
        PaceVariant pace = definition.paceVariants().get(Integer.toString(capacity));
        if (pace == null) {
            throw new IllegalStateException(
                "Plan " + definition.id() + " has no " + capacity + " minute pace."
            );
        }
        return pace;
    }

    private int normalizeCapacity(int capacity) {
        if (capacity >= 30) {
            return 30;
        }
        if (capacity >= 20) {
            return 20;
        }
        return 10;
    }

    private LocalDate normalizeScheduleDate(LocalDate date, String workPace) {
        if (isFlexible(workPace) && date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return date.plusDays(1);
        }
        return date;
    }

    private LocalDate getNextScheduleDate(LocalDate currentDate, String workPace) {
        return normalizeScheduleDate(currentDate.plusDays(1), workPace);
    }

    private boolean isFlexible(String workPace) {
        return "FLEXIBLE".equalsIgnoreCase(workPace);
    }

    private String chapterKey(Chapter chapter) {
        return chapter.getBook().getTitle() + ":" + chapter.getChapterNumber();
    }

    private Collection<String> normalizeBookTitles(List<String> titles) {
        return titles.stream()
            .map(title -> "Song of Songs".equals(title) ? "Song of Solomon" : title)
            .toList();
    }

    private PlanCatalog loadCatalog() {
        ObjectMapper mapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ClassPathResource resource = new ClassPathResource(CATALOG_PATH);

        try (InputStream input = resource.getInputStream()) {
            return mapper.readValue(input, PlanCatalog.class);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load reading plan catalog.", exception);
        }
    }

    private static final class ReadingCursor {
        private int chapterIndex;
        private int verseNumber = 1;
    }

    private record PlanCatalog(
        List<PlanDefinition> plans,
        List<ScenarioRoute> scenarioRoutes
    ) {}

    private record PlanDefinition(
        String id,
        String name,
        String description,
        String difficulty,
        int totalChapters,
        List<String> bookNames,
        Map<String, PaceVariant> paceVariants
    ) {}

    private record PaceVariant(
        int durationDays,
        int estimatedMinutesPerDay
    ) {}

    private record ScenarioRoute(
        String journeyDescription,
        String preferredStartingPoint,
        List<RouteEntry> route
    ) {}

    private record RouteEntry(
        int sequenceNumber,
        String planId
    ) {}
}
