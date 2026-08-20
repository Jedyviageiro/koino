package com.koino.backend.service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

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
    private static final long MAX_PHOTO_SIZE = 5L * 1024 * 1024;
    private static final String PHOTO_FOLDER = "koino/chat";
    private static final long ONLINE_WINDOW_SECONDS = 20;
    private static final long LAST_SEEN_WRITE_SECONDS = 60;
    private final ChatMessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final Cloudinary cloudinary;
    private final NotificationService notificationService;
    private final ConcurrentMap<String, Instant> typingUntil =
        new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, Instant> onlineUntil = new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, Instant> lastSeenByUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, Instant> lastSeenPersistedAt = new ConcurrentHashMap<>();

    public ChatService(
        ChatMessageRepository messageRepository,
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        UserService userService,
        Cloudinary cloudinary,
        NotificationService notificationService
    ) {
        this.messageRepository = messageRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.cloudinary = cloudinary;
        this.notificationService = notificationService;
    }

    @Transactional
    public List<ChatFriendResponse> friends(Long userId) {
        touchPresence(userId, true);
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
            boolean friendActive = friend.isActive();
            if (friendActive) friend = userService.ensureUsername(friend);
            ChatMessage latest = latestByFriend.get(friend.getUserId());
            result.add(new ChatFriendResponse(
                friend.getUserId(),
                friendActive ? friend.getUsername() : "",
                friendActive ? friend.getFullname() : "Deleted Account",
                friendActive ? friend.getProfilePictureUrl() : null,
                latest == null ? null : latest.getPhotoUrl() != null
                    ? (latest.getBody() == null || latest.getBody().isBlank() ? "Photo" : latest.getBody())
                    : latest.getBody(),
                latest == null ? null : latest.getMessageId(),
                latest == null ? null : latest.getSender().getUserId(),
                latest == null ? null : latest.getSentAt(),
                unreadByFriend.getOrDefault(friend.getUserId(), 0L),
                friendActive && isOnline(friend.getUserId()),
                friendActive ? lastSeen(friend) : null,
                friendActive
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
        touchPresence(userId, true);
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
        notificationService.resolveAll(userId, "CHAT_MESSAGE", friendId.toString());
        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ChatMessageResponse send(
        Long senderId,
        ChatMessageRequest request
    ) {
        touchPresence(senderId, true);
        ensureFriends(senderId, request.recipientId());
        User sender = findUser(senderId);
        User recipient = findUser(request.recipientId());
        if (!recipient.isActive()) {
            throw new IllegalArgumentException("This account is no longer available");
        }
        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setBody(request.body().trim());
        message = messageRepository.save(message);
        notificationService.createChatMessage(recipient, sender, false);
        return toResponse(message);
    }

    @Transactional
    public ChatMessageResponse sendPhoto(
        Long senderId,
        Long recipientId,
        MultipartFile file,
        String caption
    ) {
        touchPresence(senderId, true);
        ensureFriends(senderId, recipientId);
        validatePhoto(file);
        String cleanedCaption = caption == null ? null : caption.trim();
        if (cleanedCaption != null && cleanedCaption.length() > 500) {
            throw new IllegalArgumentException("Photo caption must be 500 characters or fewer");
        }
        User recipient = findUser(recipientId);
        if (!recipient.isActive()) {
            throw new IllegalArgumentException("This account is no longer available");
        }
        try {
            Map<?, ?> upload = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", PHOTO_FOLDER,
                    "unique_filename", true,
                    "overwrite", false
                )
            );
            ChatMessage message = new ChatMessage();
            message.setSender(findUser(senderId));
            message.setRecipient(recipient);
            message.setBody(cleanedCaption == null || cleanedCaption.isBlank() ? "" : cleanedCaption);
            message.setPhotoUrl(requiredUploadValue(upload, "secure_url"));
            message.setPhotoPublicId(requiredUploadValue(upload, "public_id"));
            message = messageRepository.save(message);
            notificationService.createChatMessage(message.getRecipient(), message.getSender(), true);
            return toResponse(message);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not upload the chat photo", exception);
        }
    }

    @Transactional(readOnly = true)
    public ChatTypingResponse setTyping(
        Long senderId,
        Long recipientId,
        boolean typing
    ) {
        touchPresence(senderId, false);
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
        touchPresence(userId, false);
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

    private void touchPresence(Long userId, boolean persist) {
        Instant now = Instant.now();
        onlineUntil.put(userId, now.plusSeconds(ONLINE_WINDOW_SECONDS));
        lastSeenByUser.put(userId, now);
        if (!persist) return;
        Instant lastWrite = lastSeenPersistedAt.get(userId);
        if (lastWrite != null && lastWrite.isAfter(now.minusSeconds(LAST_SEEN_WRITE_SECONDS))) return;
        User user = findUser(userId);
        user.setLastSeenAt(now);
        userRepository.save(user);
        lastSeenPersistedAt.put(userId, now);
    }

    private boolean isOnline(Long userId) {
        Instant expiry = onlineUntil.get(userId);
        return expiry != null && expiry.isAfter(Instant.now());
    }

    private Instant lastSeen(User user) {
        return lastSeenByUser.getOrDefault(user.getUserId(), user.getLastSeenAt());
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

    private void validatePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Choose a photo to send");
        if (file.getSize() > MAX_PHOTO_SIZE) throw new IllegalArgumentException("Photo must be 5 MB or smaller");
        String type = file.getContentType();
        if (type == null || !(type.equals("image/jpeg") || type.equals("image/png") || type.equals("image/webp"))) {
            throw new IllegalArgumentException("Only JPG, PNG, and WebP photos are allowed");
        }
    }

    private String requiredUploadValue(Map<?, ?> upload, String key) {
        Object value = upload.get(key);
        if (value == null || value.toString().isBlank()) throw new IllegalStateException("Photo upload did not return " + key);
        return value.toString();
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getMessageId(),
            message.getSender().getUserId(),
            message.getRecipient().getUserId(),
            message.getBody(),
            message.getPhotoUrl(),
            message.getSentAt(),
            message.getDeliveredAt(),
            message.getReadAt()
        );
    }
}
