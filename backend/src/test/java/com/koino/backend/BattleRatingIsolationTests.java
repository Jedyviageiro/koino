package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import com.koino.backend.model.BattleMode;
import com.koino.backend.model.BattleProfile;
import com.koino.backend.model.BattleQuestion;
import com.koino.backend.model.BattleRating;
import com.koino.backend.model.BattleSession;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.BattleQuestionRepository;
import com.koino.backend.repository.BattleRatingRepository;
import com.koino.backend.repository.BattleSessionRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.BattleSpaceService;

class BattleRatingIsolationTests {

    @Test
    void rapidBattleUsesOnlyRapidRating() {
        Fixture fixture = new Fixture();
        BattleRating rapid = rating(
            fixture.profile,
            BattleMode.RAPID,
            1140
        );
        when(fixture.ratings.findByProfileBattleProfileIdAndMode(
            10L,
            BattleMode.RAPID
        )).thenReturn(Optional.of(rapid));
        when(fixture.questions.findRandomForDifficulty(
            anyInt(),
            anyInt(),
            any(Pageable.class)
        )).thenReturn(List.of(question()));
        when(fixture.sessions.save(any(BattleSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        fixture.service.createBattle(1L, BattleMode.RAPID);

        BattleSession saved = fixture.savedBattle();
        assertThat(saved.getMode()).isEqualTo(BattleMode.RAPID);
        assertThat(saved.getPlayerEloBefore()).isEqualTo(1140);
        assertThat(saved.getPlayerEloAfter()).isEqualTo(1140);
    }

    @Test
    void lobbyReturnsIndependentRatingsAndLeaderboards() {
        Fixture fixture = new Fixture();
        BattleRating lightning = rating(
            fixture.profile,
            BattleMode.LIGHTNING,
            730
        );
        BattleRating rapid = rating(
            fixture.profile,
            BattleMode.RAPID,
            1280
        );
        BattleRating classical = rating(
            fixture.profile,
            BattleMode.CLASSICAL,
            1840
        );
        for (BattleRating rating : List.of(lightning, rapid, classical)) {
            when(fixture.ratings.findByProfileBattleProfileIdAndMode(
                10L,
                rating.getMode()
            )).thenReturn(Optional.of(rating));
            when(fixture.ratings.findTop10ByModeOrderByEloDescWinsDesc(
                rating.getMode()
            )).thenReturn(List.of(rating));
        }

        var lobby = fixture.service.getLobby(1L);

        assertThat(lobby.profile().ratings())
            .extracting("mode", "elo")
            .containsExactly(
                org.assertj.core.groups.Tuple.tuple("LIGHTNING", 730),
                org.assertj.core.groups.Tuple.tuple("RAPID", 1280),
                org.assertj.core.groups.Tuple.tuple("CLASSICAL", 1840)
            );
        assertThat(lobby.leaderboards()).containsOnlyKeys(
            "LIGHTNING",
            "RAPID",
            "CLASSICAL"
        );
        assertThat(lobby.leaderboards().get("RAPID").getFirst().elo())
            .isEqualTo(1280);
    }

    private static BattleRating rating(
        BattleProfile profile,
        BattleMode mode,
        int elo
    ) {
        BattleRating rating = new BattleRating();
        rating.setBattleRatingId((long) mode.ordinal() + 1);
        rating.setProfile(profile);
        rating.setMode(mode);
        rating.setElo(elo);
        return rating;
    }

    private static BattleQuestion question() {
        BattleQuestion question = new BattleQuestion();
        question.setQuestionId(1L);
        question.setPrompt("Who built the ark?");
        question.setOptionA("Noah");
        question.setOptionB("Moses");
        question.setOptionC("David");
        question.setOptionD("Paul");
        question.setCorrectOption(0);
        question.setDifficulty(2);
        question.setCategory("Bible");
        return question;
    }

    private static class Fixture {
        private final BattleProfileRepository profiles =
            mock(BattleProfileRepository.class);
        private final BattleRatingRepository ratings =
            mock(BattleRatingRepository.class);
        private final BattleQuestionRepository questions =
            mock(BattleQuestionRepository.class);
        private final BattleSessionRepository sessions =
            mock(BattleSessionRepository.class);
        private final UserRepository users = mock(UserRepository.class);
        private final User user = new User();
        private final BattleProfile profile = new BattleProfile();
        private final BattleSpaceService service;

        Fixture() {
            user.setUserId(1L);
            user.setFullname("Maria Santos");
            profile.setBattleProfileId(10L);
            profile.setUser(user);
            when(profiles.findByUserUserId(1L))
                .thenReturn(Optional.of(profile));
            service = new BattleSpaceService(
                profiles,
                ratings,
                questions,
                sessions,
                users
            );
        }

        BattleSession savedBattle() {
            return org.mockito.Mockito.mockingDetails(sessions)
                .getInvocations()
                .stream()
                .filter(invocation -> invocation.getMethod().getName()
                    .equals("save"))
                .map(invocation -> (BattleSession) invocation
                    .getArgument(0))
                .findFirst()
                .orElseThrow();
        }
    }
}
