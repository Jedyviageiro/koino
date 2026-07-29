package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.koino.backend.model.BattleChallenge;
import com.koino.backend.model.BattleChallengeStatus;
import com.koino.backend.model.BattleMode;
import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleChallengeRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.BattleChallengeService;
import com.koino.backend.service.BattleSpaceService;
import com.koino.backend.service.NotificationService;
import com.koino.backend.service.UserService;

class BattleChallengeServiceTests {

    @Test
    void acceptingOnlineChallengeCreatesPairedBattle() {
        BattleChallengeRepository challenges =
            mock(BattleChallengeRepository.class);
        FriendshipRepository friendships = mock(FriendshipRepository.class);
        BattleSpaceService battles = mock(BattleSpaceService.class);
        NotificationService notifications = mock(NotificationService.class);
        UserService userService = mock(UserService.class);
        User challenger = user(1L, "Maria", "maria");
        User addressee = user(2L, "Sarah", "sarah");
        BattleChallenge challenge = new BattleChallenge();
        challenge.setChallengeId("challenge-1");
        challenge.setChallenger(challenger);
        challenge.setAddressee(addressee);
        challenge.setMode(BattleMode.LIGHTNING);
        challenge.setStatus(BattleChallengeStatus.PENDING);
        challenge.setExpiresAt(Instant.now().plusSeconds(60));
        challenge.setChallengerLastSeenAt(Instant.now());

        when(challenges.findById("challenge-1"))
            .thenReturn(Optional.of(challenge));
        when(challenges.save(any(BattleChallenge.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(battles.createHumanBattle(1L, 2L, BattleMode.LIGHTNING))
            .thenReturn(new BattleSpaceService.HumanBattlePair(
                "battle-maria",
                "battle-sarah"
            ));
        when(userService.ensureUsername(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service(
            challenges,
            friendships,
            battles,
            notifications,
            userService
        ).accept(2L, "challenge-1");

        assertThat(response.status()).isEqualTo("ACCEPTED");
        assertThat(response.battleId()).isEqualTo("battle-sarah");
        verify(notifications).resolve(
            2L,
            "BATTLE_CHALLENGE",
            "challenge-1"
        );
    }

    private BattleChallengeService service(
        BattleChallengeRepository challenges,
        FriendshipRepository friendships,
        BattleSpaceService battles,
        NotificationService notifications,
        UserService userService
    ) {
        return new BattleChallengeService(
            challenges,
            friendships,
            mock(UserRepository.class),
            battles,
            notifications,
            userService
        );
    }

    private User user(Long id, String name, String username) {
        User user = new User();
        user.setUserId(id);
        user.setFullname(name);
        user.setUsername(username);
        user.setActive(true);
        return user;
    }
}
