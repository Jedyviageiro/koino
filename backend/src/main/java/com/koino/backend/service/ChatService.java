package com.koino.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.dto.chat.ChatFriendResponse;
import com.koino.backend.dto.chat.ChatMessageRequest;
import com.koino.backend.dto.chat.ChatMessageResponse;
import com.koino.backend.dto.chat.ChatTypingResponse;
import com.koino.backend.model.ChatMessage;
import com.koino.backend.model.Friendship;
import com.koino.backend.model.FriendshipStatus;
import com.koino.backend.model.User;
import com.koino.backend.repository.ChatMessageRepository;
import com.koino.backend.repository.FriendshipRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class ChatService {
    private final ChatMessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ConcurrentMap<String, Instant> typingUntil =
        new ConcurrentHashMap<>();

    public ChatService(
        ChatMessageRepository messageRepository,
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        UserService userService
    ) {
        this.messageRepository = messageRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional
    public List<ChatFriendResponse> friends(Long userId) {
        List<Friendship> friendships =
            friendshipRepository.findForUserByStatus(
                userId,
                FriendshipStatus.ACCEPTED
            );
        List<ChatMessage> messages = messageRepository.findAllForUser(userId);
        Map<Long, ChatMessage> latestByFriend = new HashMap<>();
        Map<Long, Long> unreadByFriend = new HashMap<>();
        List<ChatMessage> delivered = new ArrayList<>();
        Instant deliveredAt = Instant.now();
        for (ChatMessage message : messages) {
            Long friendId = message.getSender().getUserId().equals(userId)
                ? message.getRecipient().getUserId()
                : message.getSender().getUserId();
            latestByFriend.putIfAbsent(friendId, message);
            if (message.getRecipient().getUserId().equals(userId)
                && message.getReadAt() == null) {
                unreadByFriend.merge(friendId, 1L, Long::sum);
            }
            if (message.getRecipient().getUserId().equals(userId)
                && message.getDeliveredAt() == null) {
                message.setDeliveredAt(deliveredAt);
                delivered.add(message);
            }
        }
        if (!delivered.isEmpty()) messageRepository.saveAll(delivered);

        List<ChatFriendResponse> result = new ArrayList<>();
        for (Friendship friendship : friendships) {
            User friend = friendship.getRequester().getUserId().equals(userId)
                ? friendship.getAddressee()
                : friendship.getRequester();
            friend = userService.ensureUsername(friend);
            ChatMessage latest = latestByFriend.get(friend.getUserId());
            result.add(new ChatFriendResponse(
                friend.getUserId(),
                friend.getUsername(),
                friend.getFullname(),
                friend.getProfilePictureUrl(),
                latest == null ? null : latest.getBody(),
                latest == null ? null : latest.getMessageId(),
                latest == null ? null : latest.getSender().getUserId(),
                latest == null ? null : latest.getSentAt(),
                unreadByFriend.getOrDefault(friend.getUserId(), 0L)
            ));
        }
        result.sort((left, right) -> {
            if (left.lastMessageAt() == null
                && right.lastMessageAt() == null) {
                return left.fullname().compareToIgnoreCase(right.fullname());
            }
            if (left.lastMessageAt() == null) return 1;
            if (right.lastMessageAt() == null) return -1;
            return right.lastMessageAt().compareTo(left.lastMessageAt());
        });
        return result;
    }

    @Transactional
    public List<ChatMessageResponse> conversation(
        Long userId,
        Long friendId
    ) {
        ensureFriends(userId, friendId);
        List<ChatMessage> messages =
            messageRepository.findConversation(userId, friendId);
        Instant readAt = Instant.now();
        boolean changed = false;
        for (ChatMessage message : messages) {
            if (message.getRecipient().getUserId().equals(userId)
                && message.getReadAt() == null) {
                if (message.getDeliveredAt() == null) {
                    message.setDeliveredAt(readAt);
                }
                message.setReadAt(readAt);
                changed = true;
            }
        }
        if (changed) messageRepository.saveAll(messages);
        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ChatMessageResponse send(
        Long senderId,
        ChatMessageRequest request
    ) {
        ensureFriends(senderId, request.recipientId());
        User sender = findUser(senderId);
        User recipient = findUser(request.recipientId());
        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setBody(request.body().trim());
        return toResponse(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public ChatTypingResponse setTyping(
        Long senderId,
        Long recipientId,
        boolean typing
    ) {
        ensureFriends(senderId, recipientId);
        String key = typingKey(senderId, recipientId);
        if (typing) {
            typingUntil.put(key, Instant.now().plusSeconds(4));
        } else {
            typingUntil.remove(key);
        }
        return new ChatTypingResponse(typing);
    }

    @Transactional(readOnly = true)
    public ChatTypingResponse isTyping(Long userId, Long friendId) {
        ensureFriends(userId, friendId);
        String key = typingKey(friendId, userId);
        Instant expiresAt = typingUntil.get(key);
        boolean typing = expiresAt != null && expiresAt.isAfter(Instant.now());
        if (!typing) typingUntil.remove(key);
        return new ChatTypingResponse(typing);
    }

    private String typingKey(Long senderId, Long recipientId) {
        return senderId + ":" + recipientId;
    }

    private void ensureFriends(Long firstId, Long secondId) {
        if (firstId.equals(secondId)) {
            throw new IllegalArgumentException("Conversation not available");
        }
        long lower = Math.min(firstId, secondId);
        long higher = Math.max(firstId, secondId);
        friendshipRepository
            .findByLowerUserIdAndHigherUserId(lower, higher)
            .filter(item -> item.getStatus() == FriendshipStatus.ACCEPTED)
            .orElseThrow(() -> new IllegalArgumentException(
                "You can only message friends"
            ));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException(
                "User not found"
            ));
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getMessageId(),
            message.getSender().getUserId(),
            message.getRecipient().getUserId(),
            message.getBody(),
            message.getSentAt(),
            message.getDeliveredAt(),
            message.getReadAt()
        );
    }
}
