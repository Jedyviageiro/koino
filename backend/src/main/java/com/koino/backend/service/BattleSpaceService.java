package com.koino.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.battle.BattleAnswerResponse;
import com.koino.backend.dto.battle.BattleLeaderboardEntryResponse;
import com.koino.backend.dto.battle.BattleLobbyResponse;
import com.koino.backend.dto.battle.BattleModeResponse;
import com.koino.backend.dto.battle.BattleModeRatingResponse;
import com.koino.backend.dto.battle.BattleProfileResponse;
import com.koino.backend.dto.battle.BattleQuestionResponse;
import com.koino.backend.dto.battle.BattleStateResponse;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.BattleOpponentType;
import com.koino.backend.model.BattleProfile;
import com.koino.backend.model.BattleQuestion;
import com.koino.backend.model.BattleRating;
import com.koino.backend.model.BattleSession;
import com.koino.backend.model.BattleSessionQuestion;
import com.koino.backend.model.BattleStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.BattleQuestionRepository;
import com.koino.backend.repository.BattleRatingRepository;
import com.koino.backend.repository.BattleSessionRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class BattleSpaceService {
    private static final int MINIMUM_ELO = 200;
    private static final int INITIAL_QUESTION_POOL_SIZE = 80;
    private static final List<String> OPPONENT_NAMES = List.of(
        "Miriam K.",
        "Caleb J.",
        "Sarah M.",
        "Daniel R.",
        "Naomi A.",
        "Joel P.",
        "Esther L.",
        "Micah T."
    );

    private final BattleProfileRepository profileRepository;
    private final BattleRatingRepository ratingRepository;
    private final BattleQuestionRepository questionRepository;
    private final BattleSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public BattleSpaceService(
        BattleProfileRepository profileRepository,
        BattleRatingRepository ratingRepository,
        BattleQuestionRepository questionRepository,
        BattleSessionRepository sessionRepository,
        UserRepository userRepository
    ) {
        this.profileRepository = profileRepository;
        this.ratingRepository = ratingRepository;
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BattleLobbyResponse getLobby(Long userId) {
        BattleProfile profile = getOrCreateProfile(userId);
        List<BattleRating> ratings = new ArrayList<>();
        Map<String, List<BattleLeaderboardEntryResponse>> leaderboards =
            new LinkedHashMap<>();
        for (BattleMode mode : BattleMode.values()) {
            BattleRating rating = getOrCreateRating(profile, mode);
            ratings.add(rating);
            leaderboards.put(
                mode.name(),
                leaderboardFor(mode, rating, userId)
            );
        }

        return new BattleLobbyResponse(
            toProfile(ratings),
            java.util.Arrays.stream(BattleMode.values())
                .map(mode -> new BattleModeResponse(
                    mode.name(),
                    mode.getDisplayName(),
                    mode.getDurationSeconds()
                ))
                .toList(),
            leaderboards,
            true
        );
    }

    @Transactional
    public BattleStateResponse createBattle(Long userId, BattleMode mode) {
        BattleProfile profile = getOrCreateProfile(userId);
        BattleRating rating = getOrCreateRating(profile, mode);
        List<BattleQuestion> available = questionsFor(rating.getElo());

        BattleSession battle = new BattleSession();
        configureBattle(
            battle,
            rating,
            mode,
            BattleOpponentType.BOT,
            null,
            null,
            available
        );
        int seed = Math.abs(
            (userId + "-" + Instant.now().getEpochSecond()).hashCode()
        );
        battle.setOpponentName(
            OPPONENT_NAMES.get(seed % OPPONENT_NAMES.size())
        );
        int opponentOffset = (seed % 241) - 120;
        battle.setOpponentElo(Math.max(
            MINIMUM_ELO,
            rating.getElo() + opponentOffset
        ));
        return toState(sessionRepository.save(battle));
    }

    @Transactional
    public HumanBattlePair createHumanBattle(
        Long challengerId,
        Long addresseeId,
        BattleMode mode
    ) {
        BattleProfile challenger = getOrCreateProfile(challengerId);
        BattleProfile addressee = getOrCreateProfile(addresseeId);
        BattleRating challengerRating = getOrCreateRating(challenger, mode);
        BattleRating addresseeRating = getOrCreateRating(addressee, mode);
        List<BattleQuestion> available = questionsFor(
            Math.round(
                (challengerRating.getElo() + addresseeRating.getElo()) / 2f
            )
        );
        String challengerBattleId = UUID.randomUUID().toString();
        String addresseeBattleId = UUID.randomUUID().toString();

        BattleSession challengerBattle = new BattleSession();
        challengerBattle.setBattleId(challengerBattleId);
        configureBattle(
            challengerBattle,
            challengerRating,
            mode,
            BattleOpponentType.USER,
            addressee.getUser(),
            addresseeBattleId,
            available
        );
        challengerBattle.setOpponentName(
            addressee.getUser().getFullname()
        );
        challengerBattle.setOpponentElo(addresseeRating.getElo());

        BattleSession addresseeBattle = new BattleSession();
        addresseeBattle.setBattleId(addresseeBattleId);
        configureBattle(
            addresseeBattle,
            addresseeRating,
            mode,
            BattleOpponentType.USER,
            challenger.getUser(),
            challengerBattleId,
            available
        );
        addresseeBattle.setStartedAt(challengerBattle.getStartedAt());
        addresseeBattle.setExpiresAt(challengerBattle.getExpiresAt());
        addresseeBattle.setOpponentName(
            challenger.getUser().getFullname()
        );
        addresseeBattle.setOpponentElo(challengerRating.getElo());

        sessionRepository.save(challengerBattle);
        sessionRepository.save(addresseeBattle);
        return new HumanBattlePair(
            challengerBattleId,
            addresseeBattleId
        );
    }

    private List<BattleQuestion> questionsFor(int elo) {
        int difficulty = difficultyFor(elo);
        int minimumDifficulty = Math.max(1, difficulty - 1);
        int maximumDifficulty = Math.min(6, difficulty + 1);
        List<BattleQuestion> candidates =
            new ArrayList<>(questionRepository.findRandomForDifficulty(
                minimumDifficulty,
                maximumDifficulty,
                PageRequest.of(0, INITIAL_QUESTION_POOL_SIZE)
            ));
        if (candidates.isEmpty()) {
            candidates = new ArrayList<>(
                questionRepository.findRandomForDifficulty(
                    1,
                    6,
                    PageRequest.of(0, INITIAL_QUESTION_POOL_SIZE)
                )
            );
        }
        List<BattleQuestion> available = distinctUsableQuestions(candidates);
        if (available.isEmpty()) {
            throw new IllegalStateException(
                "No battle questions are available right now"
            );
        }
        return available;
    }

    private List<BattleQuestion> distinctUsableQuestions(
        List<BattleQuestion> candidates
    ) {
        Set<String> prompts = new HashSet<>();
        return candidates.stream()
            .filter(this::isUsableQuestion)
            .filter(question -> prompts.add(normalizePrompt(question.getPrompt())))
            .toList();
    }

    private boolean isUsableQuestion(BattleQuestion question) {
        return List.of(
            question.getOptionA(),
            question.getOptionB(),
            question.getOptionC(),
            question.getOptionD()
        ).stream().noneMatch(option ->
            option == null || option.matches("(?i).*\\b(?:AI|IA)\\b.*")
        );
    }

    private String normalizePrompt(String prompt) {
        return prompt == null
            ? ""
            : prompt.toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private void configureBattle(
        BattleSession battle,
        BattleRating rating,
        BattleMode mode,
        BattleOpponentType opponentType,
        User opponentUser,
        String pairedBattleId,
        List<BattleQuestion> available
    ) {
        battle.setUser(rating.getProfile().getUser());
        battle.setMode(mode);
        battle.setStatus(BattleStatus.ACTIVE);
        battle.setOpponentType(opponentType);
        battle.setOpponentUser(opponentUser);
        battle.setPairedBattleId(pairedBattleId);
        battle.setPlayerEloBefore(rating.getElo());
        battle.setPlayerEloAfter(rating.getElo());
        Instant startedAt = Instant.now();
        battle.setStartedAt(startedAt);
        battle.setExpiresAt(
            startedAt.plusSeconds(mode.getDurationSeconds())
        );

        for (int index = 0; index < available.size(); index++) {
            BattleSessionQuestion sessionQuestion =
                new BattleSessionQuestion();
            sessionQuestion.setBattle(battle);
            sessionQuestion.setQuestion(available.get(index));
            sessionQuestion.setPosition(index);
            battle.getQuestions().add(sessionQuestion);
        }
    }

    @Transactional
    public BattleStateResponse getBattle(Long userId, String battleId) {
        BattleSession battle = findBattle(userId, battleId);
        if (battle.getStatus() == BattleStatus.ACTIVE) {
            Instant now = Instant.now();
            syncOpponentProgress(battle, now);
            if (!battle.getExpiresAt().isAfter(now)) {
                settleBattle(battle, false);
            } else {
                sessionRepository.save(battle);
            }
        }
        return toState(battle);
    }

    @Transactional
    public BattleAnswerResponse answer(
        Long userId,
        String battleId,
        Long questionId,
        int selectedOption
    ) {
        BattleSession battle = findBattle(userId, battleId);
        if (battle.getStatus() != BattleStatus.ACTIVE) {
            throw new IllegalArgumentException("This battle has ended");
        }
        if (!battle.getExpiresAt().isAfter(Instant.now())) {
            settleBattle(battle, false);
            throw new IllegalArgumentException("Time is up");
        }
        syncOpponentProgress(battle, Instant.now());
        ensureQuestionAvailable(battle);

        BattleSessionQuestion sessionQuestion = battle.getQuestions()
            .get(battle.getCurrentQuestionIndex());
        BattleQuestion question = sessionQuestion.getQuestion();
        if (!question.getQuestionId().equals(questionId)) {
            throw new IllegalArgumentException(
                "That is not the active question"
            );
        }
        if (sessionQuestion.getAnsweredAt() != null) {
            throw new IllegalArgumentException(
                "This question was already answered"
            );
        }

        boolean correct = selectedOption == question.getCorrectOption();
        int points = correct ? 10 : 0;
        sessionQuestion.setSelectedOption(selectedOption);
        sessionQuestion.setCorrect(correct);
        sessionQuestion.setPointsAwarded(points);
        sessionQuestion.setAnsweredAt(Instant.now());
        battle.setPlayerScore(battle.getPlayerScore() + points);
        if (correct) {
            battle.setCorrectAnswers(battle.getCorrectAnswers() + 1);
        }
        battle.setCurrentQuestionIndex(
            battle.getCurrentQuestionIndex() + 1
        );
        ensureQuestionAvailable(battle);
        sessionRepository.save(battle);

        return new BattleAnswerResponse(
            correct,
            question.getCorrectOption(),
            question.getExplanation(),
            question.getReference(),
            points,
            toState(battle)
        );
    }

    @Transactional
    public BattleStateResponse finish(
        Long userId,
        String battleId,
        boolean abandoned
    ) {
        BattleSession battle = findBattle(userId, battleId);
        if (battle.getStatus() == BattleStatus.ACTIVE) {
            settleBattle(battle, abandoned);
        }
        return toState(battle);
    }

    private void settleBattle(BattleSession battle, boolean abandoned) {
        syncOpponentProgress(battle, Instant.now());
        if (battle.getOpponentType() == BattleOpponentType.USER
            && battle.getPairedBattleId() != null) {
            settleHumanPair(battle, abandoned);
            return;
        }
        if (abandoned) {
            battle.setPlayerScore(-1);
            battle.setStatus(BattleStatus.ABANDONED);
        } else {
            battle.setStatus(BattleStatus.COMPLETED);
        }
        battle.setCompletedAt(Instant.now());
        applyRating(battle);
        sessionRepository.save(battle);
    }

    private void settleHumanPair(
        BattleSession battle,
        boolean abandoned
    ) {
        BattleSession opponent = sessionRepository.findById(
            battle.getPairedBattleId()
        ).orElseThrow(() -> new IllegalStateException(
            "Paired battle could not be found"
        ));
        if (battle.getStatus() != BattleStatus.ACTIVE
            || opponent.getStatus() != BattleStatus.ACTIVE) {
            return;
        }
        if (abandoned) {
            battle.setPlayerScore(-1);
            battle.setStatus(BattleStatus.ABANDONED);
        } else {
            battle.setStatus(BattleStatus.COMPLETED);
        }
        opponent.setStatus(BattleStatus.COMPLETED);
        battle.setOpponentScore(opponent.getPlayerScore());
        opponent.setOpponentScore(battle.getPlayerScore());
        Instant completedAt = Instant.now();
        battle.setCompletedAt(completedAt);
        opponent.setCompletedAt(completedAt);
        applyRating(battle);
        applyRating(opponent);
        sessionRepository.save(opponent);
        sessionRepository.save(battle);
    }

    private void applyRating(BattleSession battle) {
        BattleProfile profile = getOrCreateProfile(
            battle.getUser().getUserId()
        );
        BattleRating rating = getOrCreateRating(profile, battle.getMode());
        int outcome = Integer.compare(
            battle.getPlayerScore(),
            battle.getOpponentScore()
        );
        int change = calculateEloChange(
            battle.getPlayerEloBefore(),
            battle.getOpponentElo(),
            outcome,
            battle.getBattleId()
        );
        int after = Math.max(
            MINIMUM_ELO,
            battle.getPlayerEloBefore() + change
        );
        change = after - battle.getPlayerEloBefore();
        battle.setRatingChange(change);
        battle.setPlayerEloAfter(after);

        rating.setElo(after);
        rating.setBattles(rating.getBattles() + 1);
        if (outcome > 0) {
            rating.setWins(rating.getWins() + 1);
            rating.setWinStreak(rating.getWinStreak() + 1);
            rating.setBestWinStreak(Math.max(
                rating.getBestWinStreak(),
                rating.getWinStreak()
            ));
        } else if (outcome < 0) {
            rating.setLosses(rating.getLosses() + 1);
            rating.setWinStreak(0);
        } else {
            rating.setDraws(rating.getDraws() + 1);
            rating.setWinStreak(0);
        }
        rating.setUpdatedAt(Instant.now());
        ratingRepository.save(rating);
    }

    private void syncOpponentProgress(
        BattleSession battle,
        Instant now
    ) {
        if (battle.getOpponentType() == BattleOpponentType.USER
            && battle.getPairedBattleId() != null) {
            sessionRepository.findById(battle.getPairedBattleId())
                .ifPresent(opponent -> {
                    battle.setOpponentScore(opponent.getPlayerScore());
                    battle.setOpponentAttempts(
                        opponent.getCurrentQuestionIndex()
                    );
                });
            return;
        }
        if (battle.getQuestions().isEmpty()) {
            return;
        }
        Instant effectiveNow = now.isAfter(battle.getExpiresAt())
            ? battle.getExpiresAt()
            : now;
        long elapsedMillis = Math.max(
            0,
            Duration.between(
                battle.getStartedAt(),
                effectiveNow
            ).toMillis()
        );
        int targetAttempts = (int) (
            elapsedMillis / battle.getMode().getOpponentAttemptIntervalMs()
        );
        int completedAttempts = battle.getOpponentAttempts() == null
            ? 0
            : battle.getOpponentAttempts();
        while (completedAttempts < targetAttempts) {
            int attempt = completedAttempts;
            BattleSessionQuestion question = battle.getQuestions().get(
                attempt % battle.getQuestions().size()
            );
            if (opponentAnswersCorrectly(battle, question, attempt)) {
                battle.setOpponentScore(battle.getOpponentScore() + 10);
            }
            completedAttempts = attempt + 1;
            battle.setOpponentAttempts(completedAttempts);
        }
    }

    private boolean opponentAnswersCorrectly(
        BattleSession battle,
        BattleSessionQuestion question,
        int attempt
    ) {
        int opponentTier = difficultyFor(battle.getOpponentElo());
        int questionTier = question.getQuestion().getDifficulty();
        int probability =
            64 + (opponentTier * 4) + ((opponentTier - questionTier) * 7);
        probability = Math.max(48, Math.min(95, probability));
        int roll = Math.floorMod(
            (battle.getBattleId() + ":bot:" + attempt).hashCode(),
            100
        );
        return roll < probability;
    }

    private void ensureQuestionAvailable(BattleSession battle) {
        if (battle.getCurrentQuestionIndex() < battle.getQuestions().size()) {
            return;
        }
        int difficulty = difficultyFor(battle.getPlayerEloBefore());
        List<BattleQuestion> candidates =
            questionRepository.findRandomForDifficulty(
                Math.max(1, difficulty - 1),
                Math.min(6, difficulty + 1),
                PageRequest.of(0, INITIAL_QUESTION_POOL_SIZE)
            );
        if (candidates.isEmpty()) {
            candidates = questionRepository.findRandomForDifficulty(
                1,
                6,
                PageRequest.of(0, INITIAL_QUESTION_POOL_SIZE)
            );
        }
        if (candidates.isEmpty()) {
            throw new IllegalStateException(
                "No battle questions are available right now"
            );
        }
        final List<BattleQuestion> questionCandidates =
            distinctUsableQuestions(candidates);
        if (questionCandidates.isEmpty()) {
            throw new IllegalStateException(
                "No battle questions are available right now"
            );
        }

        Set<Long> usedQuestionIds = new HashSet<>();
        Set<String> usedPrompts = new HashSet<>();
        for (BattleSessionQuestion existing : battle.getQuestions()) {
            usedQuestionIds.add(existing.getQuestion().getQuestionId());
            usedPrompts.add(normalizePrompt(
                existing.getQuestion().getPrompt()
            ));
        }
        BattleQuestion next = questionCandidates.stream()
            .filter(candidate ->
                !usedQuestionIds.contains(candidate.getQuestionId())
                    && !usedPrompts.contains(normalizePrompt(
                        candidate.getPrompt()
                    ))
            )
            .findFirst()
            .orElseGet(() -> questionCandidates.get(Math.floorMod(
                (battle.getBattleId() + ":" + battle.getQuestions().size())
                    .hashCode(),
                questionCandidates.size()
            )));

        BattleSessionQuestion sessionQuestion = new BattleSessionQuestion();
        sessionQuestion.setBattle(battle);
        sessionQuestion.setQuestion(next);
        sessionQuestion.setPosition(battle.getQuestions().size());
        battle.getQuestions().add(sessionQuestion);
    }

    public static int calculateEloChange(
        int playerElo,
        int opponentElo,
        int outcome,
        String battleId
    ) {
        if (outcome == 0) {
            return 0;
        }
        int difference = opponentElo - playerElo;
        int minimum;
        int maximum;
        if (outcome > 0) {
            if (difference >= 250) {
                minimum = 18;
                maximum = 25;
            } else if (difference >= 75) {
                minimum = 11;
                maximum = 14;
            } else if (difference <= -250) {
                minimum = 1;
                maximum = 3;
            } else if (difference <= -75) {
                minimum = 5;
                maximum = 7;
            } else {
                minimum = 8;
                maximum = 10;
            }
        } else {
            if (difference >= 250) {
                minimum = 2;
                maximum = 4;
            } else if (difference >= 75) {
                minimum = 6;
                maximum = 8;
            } else if (difference <= -250) {
                minimum = 18;
                maximum = 22;
            } else if (difference <= -75) {
                minimum = 11;
                maximum = 13;
            } else {
                minimum = 8;
                maximum = 10;
            }
        }
        int amount = minimum + Math.floorMod(
            battleId.hashCode(),
            maximum - minimum + 1
        );
        return outcome > 0 ? amount : -amount;
    }

    private BattleSession findBattle(Long userId, String battleId) {
        return sessionRepository.findOwnedForUpdate(battleId, userId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Battle not found"
            ));
    }

    private BattleProfile getOrCreateProfile(Long userId) {
        return profileRepository.findByUserUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "User not found"
                ));
            BattleProfile profile = new BattleProfile();
            profile.setUser(user);
            profile.setElo(MINIMUM_ELO);
            return profileRepository.save(profile);
        });
    }

    private BattleRating getOrCreateRating(
        BattleProfile profile,
        BattleMode mode
    ) {
        return ratingRepository
            .findByProfileBattleProfileIdAndMode(
                profile.getBattleProfileId(),
                mode
            )
            .orElseGet(() -> {
                BattleRating rating = new BattleRating();
                rating.setProfile(profile);
                rating.setMode(mode);
                if (mode == BattleMode.LIGHTNING) {
                    rating.setElo(Math.max(MINIMUM_ELO, profile.getElo()));
                    rating.setBattles(profile.getBattles());
                    rating.setWins(profile.getWins());
                    rating.setLosses(profile.getLosses());
                    rating.setDraws(profile.getDraws());
                    rating.setWinStreak(profile.getWinStreak());
                    rating.setBestWinStreak(profile.getBestWinStreak());
                } else {
                    rating.setElo(MINIMUM_ELO);
                }
                return ratingRepository.save(rating);
            });
    }

    private List<BattleLeaderboardEntryResponse> leaderboardFor(
        BattleMode mode,
        BattleRating currentRating,
        Long userId
    ) {
        List<BattleLeaderboardEntryResponse> leaderboard =
            new ArrayList<>();
        int position = 1;
        for (BattleRating rating :
            ratingRepository.findTop10ByModeOrderByEloDescWinsDesc(mode)) {
            User leader = rating.getProfile().getUser();
            leaderboard.add(new BattleLeaderboardEntryResponse(
                position++,
                leader.getUserId(),
                leader.getFullname(),
                leader.getProfilePictureUrl(),
                rating.getElo(),
                rankFor(rating.getElo()),
                leader.getUserId().equals(userId)
            ));
        }
        if (leaderboard.stream().noneMatch(
            BattleLeaderboardEntryResponse::currentUser
        )) {
            User currentUser = currentRating.getProfile().getUser();
            leaderboard.add(new BattleLeaderboardEntryResponse(
                position,
                userId,
                currentUser.getFullname(),
                currentUser.getProfilePictureUrl(),
                currentRating.getElo(),
                rankFor(currentRating.getElo()),
                true
            ));
        }
        return leaderboard;
    }

    private BattleProfileResponse toProfile(List<BattleRating> ratings) {
        return new BattleProfileResponse(
            ratings.stream().map(this::toModeRating).toList(),
            ratings.stream().mapToInt(BattleRating::getBattles).sum(),
            ratings.stream().mapToInt(BattleRating::getWins).sum()
        );
    }

    private BattleModeRatingResponse toModeRating(BattleRating rating) {
        int winRate = rating.getBattles() == 0
            ? 0
            : Math.round((rating.getWins() * 100f) / rating.getBattles());
        return new BattleModeRatingResponse(
            rating.getMode().name(),
            rating.getMode().getDisplayName(),
            rating.getElo(),
            rankFor(rating.getElo()),
            rating.getBattles(),
            rating.getWins(),
            rating.getLosses(),
            rating.getDraws(),
            rating.getWinStreak(),
            rating.getBestWinStreak(),
            winRate,
            nextRankElo(rating.getElo())
        );
    }

    private BattleStateResponse toState(BattleSession battle) {
        BattleQuestionResponse currentQuestion = null;
        if (battle.getStatus() == BattleStatus.ACTIVE
            && battle.getCurrentQuestionIndex() < battle.getQuestions().size()) {
            BattleSessionQuestion sessionQuestion = battle.getQuestions()
                .get(battle.getCurrentQuestionIndex());
            BattleQuestion question = sessionQuestion.getQuestion();
            currentQuestion = new BattleQuestionResponse(
                question.getQuestionId(),
                battle.getCurrentQuestionIndex() + 1,
                localizedQuestionPrompt(battle, question),
                localizedQuestionOptions(battle, question),
                question.getDifficulty(),
                localizedQuestionCategory(battle, question)
            );
        }
        boolean complete = battle.getStatus() != BattleStatus.ACTIVE;
        String result = complete
            ? resultFor(battle)
            : null;
        return new BattleStateResponse(
            battle.getBattleId(),
            battle.getMode().name(),
            battle.getMode().getDisplayName(),
            battle.getStatus().name(),
            battle.getMode().getDurationSeconds(),
            battle.getStartedAt(),
            battle.getExpiresAt(),
            battle.getCurrentQuestionIndex(),
            battle.getPlayerScore(),
            battle.getOpponentScore(),
            battle.getOpponentName(),
            battle.getOpponentElo(),
            battle.getOpponentType() == null
                ? BattleOpponentType.BOT.name()
                : battle.getOpponentType().name(),
            currentQuestion,
            complete ? battle.getPlayerEloBefore() : null,
            complete ? battle.getRatingChange() : null,
            complete ? battle.getPlayerEloAfter() : null,
            result,
            battle.getOpponentUser() == null
                ? null
                : battle.getOpponentUser().getUserId()
        );
    }

    private String localizedQuestionPrompt(
        BattleSession battle,
        BattleQuestion question
    ) {
        return usePortuguese(battle) && hasText(question.getPromptPt())
            ? question.getPromptPt()
            : question.getPrompt();
    }

    private List<String> localizedQuestionOptions(
        BattleSession battle,
        BattleQuestion question
    ) {
        if (usePortuguese(battle)
            && hasText(question.getOptionAPt())
            && hasText(question.getOptionBPt())
            && hasText(question.getOptionCPt())
            && hasText(question.getOptionDPt())) {
            return List.of(
                question.getOptionAPt(),
                question.getOptionBPt(),
                question.getOptionCPt(),
                question.getOptionDPt()
            );
        }
        return List.of(
            question.getOptionA(),
            question.getOptionB(),
            question.getOptionC(),
            question.getOptionD()
        );
    }

    private String localizedQuestionCategory(
        BattleSession battle,
        BattleQuestion question
    ) {
        return usePortuguese(battle) && hasText(question.getCategoryPt())
            ? question.getCategoryPt()
            : question.getCategory();
    }

    private boolean usePortuguese(BattleSession battle) {
        String language = battle.getUser().getLanguage();
        return language != null
            && language.toLowerCase(java.util.Locale.ROOT).startsWith("pt");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String resultFor(BattleSession battle) {
        if (battle.getStatus() == BattleStatus.ABANDONED) {
            return "LOSS";
        }
        int comparison = Integer.compare(
            battle.getPlayerScore(),
            battle.getOpponentScore()
        );
        return comparison > 0 ? "WIN" : comparison < 0 ? "LOSS" : "DRAW";
    }

    public static int difficultyFor(int elo) {
        if (elo >= 2600) return 6;
        if (elo >= 2200) return 5;
        if (elo >= 1700) return 4;
        if (elo >= 1200) return 3;
        if (elo >= 700) return 2;
        return 1;
    }

    public static String rankFor(int elo) {
        if (elo >= 2600) return "Super Grandmaster";
        if (elo >= 2200) return "Grandmaster";
        if (elo >= 1700) return "Master";
        if (elo >= 1200) return "Scribe";
        if (elo >= 700) return "Disciple";
        return "Novice";
    }

    private int nextRankElo(int elo) {
        if (elo < 700) return 700;
        if (elo < 1200) return 1200;
        if (elo < 1700) return 1700;
        if (elo < 2200) return 2200;
        if (elo < 2600) return 2600;
        return elo;
    }

    public record HumanBattlePair(
        String challengerBattleId,
        String addresseeBattleId
    ) {}
}
