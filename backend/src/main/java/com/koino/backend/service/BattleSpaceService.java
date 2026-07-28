package com.koino.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.battle.BattleAnswerResponse;
import com.koino.backend.dto.battle.BattleLeaderboardEntryResponse;
import com.koino.backend.dto.battle.BattleLobbyResponse;
import com.koino.backend.dto.battle.BattleModeResponse;
import com.koino.backend.dto.battle.BattleProfileResponse;
import com.koino.backend.dto.battle.BattleQuestionResponse;
import com.koino.backend.dto.battle.BattleStateResponse;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.BattleProfile;
import com.koino.backend.model.BattleQuestion;
import com.koino.backend.model.BattleSession;
import com.koino.backend.model.BattleSessionQuestion;
import com.koino.backend.model.BattleStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.BattleQuestionRepository;
import com.koino.backend.repository.BattleSessionRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class BattleSpaceService {
    private static final int MINIMUM_ELO = 200;
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
    private final BattleQuestionRepository questionRepository;
    private final BattleSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public BattleSpaceService(
        BattleProfileRepository profileRepository,
        BattleQuestionRepository questionRepository,
        BattleSessionRepository sessionRepository,
        UserRepository userRepository
    ) {
        this.profileRepository = profileRepository;
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BattleLobbyResponse getLobby(Long userId) {
        BattleProfile profile = getOrCreateProfile(userId);
        List<BattleProfile> leaders =
            profileRepository.findTop10ByOrderByEloDescWinsDesc();
        List<BattleLeaderboardEntryResponse> leaderboard =
            new ArrayList<>();
        int position = 1;
        for (BattleProfile leader : leaders) {
            leaderboard.add(new BattleLeaderboardEntryResponse(
                position++,
                leader.getUser().getUserId(),
                leader.getUser().getFullname(),
                leader.getUser().getProfilePictureUrl(),
                leader.getElo(),
                rankFor(leader.getElo()),
                leader.getUser().getUserId().equals(userId)
            ));
        }
        if (leaderboard.stream().noneMatch(
            BattleLeaderboardEntryResponse::currentUser
        )) {
            leaderboard.add(new BattleLeaderboardEntryResponse(
                position,
                userId,
                profile.getUser().getFullname(),
                profile.getUser().getProfilePictureUrl(),
                profile.getElo(),
                rankFor(profile.getElo()),
                true
            ));
        }

        return new BattleLobbyResponse(
            toProfile(profile),
            Arrays.stream(BattleMode.values())
                .map(mode -> new BattleModeResponse(
                    mode.name(),
                    mode.getDisplayName(),
                    mode.getQuestionCount(),
                    mode.getDurationSeconds()
                ))
                .toList(),
            leaderboard,
            (int) questionRepository.count(),
            true
        );
    }

    @Transactional
    public BattleStateResponse createBattle(Long userId, BattleMode mode) {
        BattleProfile profile = getOrCreateProfile(userId);
        int difficulty = difficultyFor(profile.getElo());
        int minimumDifficulty = Math.max(1, difficulty - 1);
        int maximumDifficulty = Math.min(6, difficulty + 1);
        List<BattleQuestion> available =
            new ArrayList<>(questionRepository.findRandomForDifficulty(
                minimumDifficulty,
                maximumDifficulty
            ));
        if (available.size() < mode.getQuestionCount()) {
            available = new ArrayList<>(
                questionRepository.findRandomForDifficulty(1, 6)
            );
        }
        if (available.size() < mode.getQuestionCount()) {
            throw new IllegalStateException(
                "Battle Space needs more locally backed questions"
            );
        }

        BattleSession battle = new BattleSession();
        battle.setUser(profile.getUser());
        battle.setMode(mode);
        battle.setStatus(BattleStatus.ACTIVE);
        battle.setPlayerEloBefore(profile.getElo());
        battle.setPlayerEloAfter(profile.getElo());
        int seed = Math.abs(
            (userId + "-" + Instant.now().getEpochSecond()).hashCode()
        );
        battle.setOpponentName(
            OPPONENT_NAMES.get(seed % OPPONENT_NAMES.size())
        );
        int opponentOffset = (seed % 241) - 120;
        battle.setOpponentElo(Math.max(
            MINIMUM_ELO,
            profile.getElo() + opponentOffset
        ));
        Instant startedAt = Instant.now();
        battle.setStartedAt(startedAt);
        battle.setExpiresAt(
            startedAt.plusSeconds(mode.getDurationSeconds())
        );

        for (int index = 0; index < mode.getQuestionCount(); index++) {
            BattleSessionQuestion sessionQuestion =
                new BattleSessionQuestion();
            sessionQuestion.setBattle(battle);
            sessionQuestion.setQuestion(available.get(index));
            sessionQuestion.setPosition(index);
            battle.getQuestions().add(sessionQuestion);
        }
        return toState(sessionRepository.save(battle));
    }

    @Transactional
    public BattleStateResponse getBattle(Long userId, String battleId) {
        BattleSession battle = findBattle(userId, battleId);
        if (battle.getStatus() == BattleStatus.ACTIVE
            && !battle.getExpiresAt().isAfter(Instant.now())) {
            settleBattle(battle, false);
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
        if (battle.getCurrentQuestionIndex() >= battle.getQuestions().size()) {
            settleBattle(battle, false);
            throw new IllegalArgumentException("This battle has ended");
        }

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
        if (opponentAnswersCorrectly(battle, sessionQuestion)) {
            battle.setOpponentScore(battle.getOpponentScore() + 10);
        }
        battle.setCurrentQuestionIndex(
            battle.getCurrentQuestionIndex() + 1
        );
        if (battle.getCurrentQuestionIndex() >= battle.getQuestions().size()) {
            settleBattle(battle, false);
        } else {
            sessionRepository.save(battle);
        }

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
        while (battle.getCurrentQuestionIndex() < battle.getQuestions().size()) {
            BattleSessionQuestion unanswered = battle.getQuestions()
                .get(battle.getCurrentQuestionIndex());
            if (opponentAnswersCorrectly(battle, unanswered)) {
                battle.setOpponentScore(battle.getOpponentScore() + 10);
            }
            battle.setCurrentQuestionIndex(
                battle.getCurrentQuestionIndex() + 1
            );
        }
        if (abandoned) {
            battle.setPlayerScore(-1);
            battle.setStatus(BattleStatus.ABANDONED);
        } else {
            battle.setStatus(BattleStatus.COMPLETED);
        }
        battle.setCompletedAt(Instant.now());

        BattleProfile profile = getOrCreateProfile(
            battle.getUser().getUserId()
        );
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

        profile.setElo(after);
        profile.setBattles(profile.getBattles() + 1);
        if (outcome > 0) {
            profile.setWins(profile.getWins() + 1);
            profile.setWinStreak(profile.getWinStreak() + 1);
            profile.setBestWinStreak(Math.max(
                profile.getBestWinStreak(),
                profile.getWinStreak()
            ));
        } else if (outcome < 0) {
            profile.setLosses(profile.getLosses() + 1);
            profile.setWinStreak(0);
        } else {
            profile.setDraws(profile.getDraws() + 1);
            profile.setWinStreak(0);
        }
        profile.setUpdatedAt(Instant.now());
        profileRepository.save(profile);
        sessionRepository.save(battle);
    }

    private boolean opponentAnswersCorrectly(
        BattleSession battle,
        BattleSessionQuestion question
    ) {
        int opponentTier = difficultyFor(battle.getOpponentElo());
        int questionTier = question.getQuestion().getDifficulty();
        int probability = 68 + ((opponentTier - questionTier) * 9);
        probability = Math.max(22, Math.min(92, probability));
        int roll = Math.floorMod(
            (battle.getBattleId() + ":" + question.getPosition()).hashCode(),
            100
        );
        return roll < probability;
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
        return sessionRepository.findByBattleIdAndUserUserId(battleId, userId)
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

    private BattleProfileResponse toProfile(BattleProfile profile) {
        int winRate = profile.getBattles() == 0
            ? 0
            : Math.round((profile.getWins() * 100f) / profile.getBattles());
        return new BattleProfileResponse(
            profile.getElo(),
            rankFor(profile.getElo()),
            profile.getBattles(),
            profile.getWins(),
            profile.getLosses(),
            profile.getDraws(),
            profile.getWinStreak(),
            profile.getBestWinStreak(),
            winRate,
            nextRankElo(profile.getElo())
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
                battle.getQuestions().size(),
                question.getPrompt(),
                List.of(
                    question.getOptionA(),
                    question.getOptionB(),
                    question.getOptionC(),
                    question.getOptionD()
                ),
                question.getDifficulty(),
                question.getCategory()
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
            battle.getQuestions().size(),
            battle.getMode().getDurationSeconds(),
            battle.getStartedAt(),
            battle.getExpiresAt(),
            battle.getCurrentQuestionIndex(),
            battle.getPlayerScore(),
            battle.getOpponentScore(),
            battle.getOpponentName(),
            battle.getOpponentElo(),
            currentQuestion,
            complete ? battle.getPlayerEloBefore() : null,
            complete ? battle.getRatingChange() : null,
            complete ? battle.getPlayerEloAfter() : null,
            result
        );
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
}
