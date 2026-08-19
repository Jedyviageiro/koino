package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.BattleProfileRepository;
import com.koino.backend.repository.BattleRatingRepository;
import com.koino.backend.repository.CommunityPostRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserActivePlanRepositor;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.FriendshipService;
import com.koino.backend.service.NotificationService;
import com.koino.backend.service.PlanLocalizationService;
import com.koino.backend.service.UserService;
import com.koino.backend.service.GmailService.EmailService;

class FriendshipServiceTests {

    @Test
    void createsPendingRequestAndNotifiesRecipient() {
        FriendshipRepository friendships = mock(FriendshipRepository.class);
        UserRepository users = mock(UserRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        UserService userService = mock(UserService.class);
        User requester = user(1L, "Maria", "maria");
        User addressee = user(2L, "Sarah", "sarah");

        when(users.findById(1L)).thenReturn(Optional.of(requester));
        when(users.findById(2L)).thenReturn(Optional.of(addressee));
        when(friendships.findByLowerUserIdAndHigherUserId(1L, 2L))
            .thenReturn(Optional.empty());
        when(friendships.save(any(Friendship.class))).thenAnswer(invocation -> {
            Friendship friendship = invocation.getArgument(0);
            friendship.setFriendshipId(10L);
            return friendship;
        });
        when(userService.ensureUsername(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service(
            friendships,
            users,
            notifications,
            userService
        ).request(1L, 2L);

        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.direction()).isEqualTo("OUTGOING");
        assertThat(response.user().username()).isEqualTo("sarah");
        verify(notifications).createFriendRequest(addressee, requester, 10L);
    }

    @Test
    void findsFriendByNormalizedPrivateCode() {
        FriendshipRepository friendships = mock(FriendshipRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserService userService = mock(UserService.class);
        User friend = user(2L, "Sarah", "sarah");
        friend.setFriendCode("AB12-CD34");
        when(users.findByFriendCodeIgnoreCase("AB12-CD34"))
            .thenReturn(Optional.of(friend));
        when(userService.ensureUsername(friend)).thenReturn(friend);

        var response = service(
            friendships,
            users,
            mock(NotificationService.class),
            userService
        ).profileByFriendCode(1L, "ab12 cd34");

        assertThat(response.userId()).isEqualTo(2L);
        assertThat(response.username()).isEqualTo("sarah");
    }

    @Test
    void rejectsCurrentUsersOwnPrivateCode() {
        FriendshipRepository friendships = mock(FriendshipRepository.class);
        UserRepository users = mock(UserRepository.class);
        User current = user(1L, "Maria", "maria");
        current.setFriendCode("AB12-CD34");
        when(users.findByFriendCodeIgnoreCase("AB12-CD34"))
            .thenReturn(Optional.of(current));

        assertThatThrownBy(() -> service(
            friendships,
            users,
            mock(NotificationService.class),
            mock(UserService.class)
        ).profileByFriendCode(1L, "AB12-CD34"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("You cannot add your own friend code");
    }

    @Test
    void requesterCanCancelPendingFriendRequest() {
        FriendshipRepository friendships = mock(FriendshipRepository.class);
        UserRepository users = mock(UserRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        User requester = user(1L, "Maria", "maria");
        User addressee = user(2L, "Sarah", "sarah");
        Friendship pending = new Friendship();
        pending.setFriendshipId(10L);
        pending.setRequester(requester);
        pending.setAddressee(addressee);
        pending.setStatus(FriendshipStatus.PENDING);
        when(friendships.findById(10L)).thenReturn(Optional.of(pending));

        service(friendships, users, notifications, mock(UserService.class))
            .rejectOrRemove(1L, 10L);

        verify(friendships).delete(pending);
        verify(notifications).resolve(2L, "FRIEND_REQUEST", "10");
    }

    private FriendshipService service(
        FriendshipRepository friendships,
        UserRepository users,
        NotificationService notifications,
        UserService userService
    ) {
        return new FriendshipService(
            friendships,
            users,
            mock(UserProfileRepository.class),
            mock(UserActivePlanRepositor.class),
            mock(BattleProfileRepository.class),
            mock(BattleRatingRepository.class),
            mock(CommunityPostRepository.class),
            notifications,
            userService,
            mock(EmailService.class),
            mock(PlanLocalizationService.class)
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
