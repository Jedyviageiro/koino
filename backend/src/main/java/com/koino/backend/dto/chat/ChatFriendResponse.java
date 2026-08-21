package com.koino.backend.dto.chat;

import java.time.Instant;

public record ChatFriendResponse(
    Long userId,
    String username,
    String fullname,
    String profilePictureUrl,
    String lastMessage,
    Long lastMessageId,
    Long lastMessageSenderId,
    Instant lastMessageAt,
    long unreadCount,
    boolean online,
    Instant lastSeenAt,
    boolean active,
    boolean blockedByMe,
    boolean blockedMe
) {}
