package com.koino.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.user.DevicePushTokenRequest;
import com.koino.backend.model.User;
import com.koino.backend.service.DevicePushService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
public class DeviceNotificationController {
    private final DevicePushService pushService;

    public DeviceNotificationController(DevicePushService pushService) {
        this.pushService = pushService;
    }

    @PostMapping("/device-token")
    public void register(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody DevicePushTokenRequest request
    ) {
        pushService.register(user.getUserId(), request.token(), request.platform());
    }
}
