package com.koino.backend.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.chat.ChatFriendResponse;
import com.koino.backend.dto.chat.ChatMessageRequest;
import com.koino.backend.dto.chat.ChatMessageResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.ChatService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/friends")
    public List<ChatFriendResponse> friends(
        @AuthenticationPrincipal User user
    ) {
        return chatService.friends(user.getUserId());
    }

    @GetMapping("/conversations/{friendId}")
    public List<ChatMessageResponse> conversation(
        @AuthenticationPrincipal User user,
        @PathVariable Long friendId
    ) {
        return chatService.conversation(user.getUserId(), friendId);
    }

    @PostMapping("/messages")
    public ChatMessageResponse send(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody ChatMessageRequest request
    ) {
        return chatService.send(user.getUserId(), request);
    }
}
