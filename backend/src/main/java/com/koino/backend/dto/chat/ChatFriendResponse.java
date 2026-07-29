package com.koino.backend.dto.chat;

import java.time.Instant;

public record ChatFriendResponse(
    Long userId,
    String username,
    String fullname,
    String profilePictureUrl,
    String lastMessage,
    Instant lastMessageAt,
    long unreadCount
) {}
