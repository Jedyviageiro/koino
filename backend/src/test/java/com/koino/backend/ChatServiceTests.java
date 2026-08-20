package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cloudinary.Cloudinary;
import com.koino.backend.dto.chat.ChatMessageRequest;
import com.koino.backend.model.ChatMessage;
import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.ChatMessageRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.ChatService;
import com.koino.backend.service.ContentModerationService;
import com.koino.backend.service.NotificationService;
import com.koino.backend.service.TrustSafetyService;
import com.koino.backend.service.UserService;

class ChatServiceTests {

    @Test
    void sendsMessageAndCreatesRecipientNotification() {
        Fixture fixture = new Fixture();
        when(fixture.messages.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setMessageId(10L);
            message.setSentAt(Instant.now());
            return message;
        });

        var response = fixture.service.send(1L, new ChatMessageRequest(2L, "Hello"));

        assertThat(response.body()).isEqualTo("Hello");
        assertThat(response.deliveredAt()).isNull();
        assertThat(response.readAt()).isNull();
        verify(fixture.notifications).createChatMessage(fixture.second, fixture.first, false);
    }

    @Test
    void openingConversationMarksIncomingMessagesDeliveredAndRead() {
        Fixture fixture = new Fixture();
        ChatMessage incoming = new ChatMessage();
        incoming.setMessageId(11L);
        incoming.setSender(fixture.first);
        incoming.setRecipient(fixture.second);
        incoming.setBody("Hello");
        incoming.setSentAt(Instant.now().minusSeconds(10));
        when(fixture.messages.findConversation(2L, 1L)).thenReturn(List.of(incoming));

        var response = fixture.service.conversation(2L, 1L);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).deliveredAt()).isNotNull();
        assertThat(response.get(0).readAt()).isNotNull();
        verify(fixture.messages).saveAll(List.of(incoming));
        verify(fixture.notifications).resolveAll(2L, "CHAT_MESSAGE", "1");
    }

    @Test
    void reportsActiveFriendAsOnlineWithLastSeenTime() {
        Fixture fixture = new Fixture();
        when(fixture.friendships.findForUserByStatus(1L, FriendshipStatus.ACCEPTED)).thenReturn(List.of(fixture.friendship));
        when(fixture.friendships.findForUserByStatus(2L, FriendshipStatus.ACCEPTED)).thenReturn(List.of(fixture.friendship));
        when(fixture.messages.findAllForUser(1L)).thenReturn(List.of());
        when(fixture.messages.findAllForUser(2L)).thenReturn(List.of());
        when(fixture.userService.ensureUsername(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        fixture.service.friends(2L);
        var friends = fixture.service.friends(1L);

        assertThat(friends).hasSize(1);
        assertThat(friends.get(0).online()).isTrue();
        assertThat(friends.get(0).lastSeenAt()).isNotNull();
    }

    private static final class Fixture {
        private final ChatMessageRepository messages = mock(ChatMessageRepository.class);
        private final FriendshipRepository friendships = mock(FriendshipRepository.class);
        private final UserRepository users = mock(UserRepository.class);
        private final UserService userService = mock(UserService.class);
        private final NotificationService notifications = mock(NotificationService.class);
        private final User first = user(1L, "Maria");
        private final User second = user(2L, "Sarah");
        private final Friendship friendship = accepted(first, second);
        private final ChatService service;

        private Fixture() {
            when(users.findById(1L)).thenReturn(Optional.of(first));
            when(users.findById(2L)).thenReturn(Optional.of(second));
            when(friendships.findByLowerUserIdAndHigherUserId(1L, 2L)).thenReturn(Optional.of(friendship));
            service = new ChatService(messages, friendships, users, userService, mock(Cloudinary.class), notifications, mock(TrustSafetyService.class), mock(ContentModerationService.class));
        }
    }

    private static User user(Long id, String name) {
        User user = new User();
        user.setUserId(id);
        user.setFullname(name);
        user.setUsername(name.toLowerCase());
        user.setActive(true);
        return user;
    }

    private static Friendship accepted(User first, User second) {
        Friendship friendship = new Friendship();
        friendship.setRequester(first);
        friendship.setAddressee(second);
        friendship.setLowerUserId(1L);
        friendship.setHigherUserId(2L);
        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return friendship;
    }
}
