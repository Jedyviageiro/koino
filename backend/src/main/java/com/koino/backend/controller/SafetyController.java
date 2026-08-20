package com.koino.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.koino.backend.dto.safety.*;
import com.koino.backend.model.User;
import com.koino.backend.service.TrustSafetyService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/safety")
public class SafetyController {
    private final TrustSafetyService safety;
    public SafetyController(TrustSafetyService safety) { this.safety = safety; }

    @PostMapping("/reports/posts/{postId}")
    public SafetyActionResponse reportPost(@AuthenticationPrincipal User user, @PathVariable Long postId, @Valid @RequestBody ReportRequest request) {
        safety.reportPost(user.getUserId(), postId, request.reason(), request.details());
        return new SafetyActionResponse("Thank you. The post was sent for review.");
    }

    @PostMapping("/reports/users/{userId}")
    public SafetyActionResponse reportUser(@AuthenticationPrincipal User user, @PathVariable Long userId, @Valid @RequestBody ReportRequest request) {
        safety.reportUser(user.getUserId(), userId, request.reason(), request.details());
        return new SafetyActionResponse("Thank you. The account was sent for review.");
    }

    @PostMapping("/blocks/{userId}")
    public SafetyActionResponse block(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        safety.block(user.getUserId(), userId);
        return new SafetyActionResponse("This user has been blocked.");
    }

    @DeleteMapping("/blocks/{userId}")
    public SafetyActionResponse unblock(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        safety.unblock(user.getUserId(), userId);
        return new SafetyActionResponse("This user has been unblocked.");
    }
}
