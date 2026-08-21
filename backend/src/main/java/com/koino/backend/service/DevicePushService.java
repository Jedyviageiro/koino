package com.koino.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.koino.backend.model.DevicePushToken;
import com.koino.backend.model.User;
import com.koino.backend.model.UserNotification;
import com.koino.backend.repository.DevicePushTokenRepository;
import com.koino.backend.repository.UserRepository;

@Service
public class DevicePushService {
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final DevicePushTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RestClient restClient = RestClient.create();

    public DevicePushService(DevicePushTokenRepository tokenRepository, UserRepository userRepository) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void register(Long userId, String token, String platform) {
        DevicePushToken device = tokenRepository.findById(token).orElseGet(DevicePushToken::new);
        device.setToken(token.trim());
        device.setUser(userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found")));
        device.setPlatform(platform == null ? null : platform.trim());
        tokenRepository.save(device);
    }

    public void send(UserNotification notification) {
        List<String> tokens = tokenRepository.findByUserUserId(notification.getUser().getUserId())
            .stream().map(DevicePushToken::getToken).toList();
        if (tokens.isEmpty()) return;

        Map<String, Object> base = new LinkedHashMap<>();
        base.put("sound", "default");
        base.put("channelId", "koino-updates");
        base.put("title", notification.getTitle());
        base.put("body", notification.getMessage());
        base.put("data", Map.of(
            "type", notification.getType(),
            "referenceId", notification.getReferenceId() == null ? "" : notification.getReferenceId(),
            "route", route(notification)
        ));
        User actor = notification.getActor();
        if (actor != null && actor.getProfilePictureUrl() != null && !actor.getProfilePictureUrl().isBlank()) {
            base.put("richContent", Map.of("image", actor.getProfilePictureUrl()));
        }

        List<Map<String, Object>> payload = new ArrayList<>();
        for (String token : tokens) {
            Map<String, Object> item = new LinkedHashMap<>(base);
            item.put("to", token);
            payload.add(item);
        }
        CompletableFuture.runAsync(() -> {
            try {
                restClient.post().uri(EXPO_PUSH_URL).body(payload).retrieve().toBodilessEntity();
            } catch (RuntimeException ignored) {
                // A temporary notification-provider issue must never interrupt the user action.
            }
        });
    }

    private String route(UserNotification notification) {
        return switch (notification.getType()) {
            case "CHAT_MESSAGE" -> "/chat/" + notification.getReferenceId();
            case "READING_REMINDER" -> "/devotional";
            case "PLAN_READY" -> "/plans";
            default -> "/notifications";
        };
    }
}
