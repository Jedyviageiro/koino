package com.koino.backend.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.koino.backend.dto.community.CommunityCommentResponse;
import com.koino.backend.dto.community.CommunityPostResponse;
import com.koino.backend.dto.community.CreateCommunityCommentRequest;
import com.koino.backend.dto.community.CreateCommunityPostRequest;
import com.koino.backend.model.User;
import com.koino.backend.service.CommunityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/posts")
    public List<CommunityPostResponse> getFeed(
        @RequestParam(defaultValue = "ALL") String type
    ) {
        return communityService.getFeed(type);
    }

    @PostMapping("/posts")
    public CommunityPostResponse createPost(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreateCommunityPostRequest request
    ) {
        return communityService.createPost(user.getUserId(), request);
    }

    @PostMapping(
        value = "/posts/photo",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public CommunityPostResponse createPhotoPost(
        @AuthenticationPrincipal User user,
        @RequestPart("file") MultipartFile file,
        @RequestParam(defaultValue = "") String caption
    ) {
        return communityService.createPhotoPost(
            user.getUserId(),
            file,
            caption
        );
    }

    @PostMapping("/posts/{postId}/comments")
    public CommunityCommentResponse addComment(
        @AuthenticationPrincipal User user,
        @PathVariable Long postId,
        @Valid @RequestBody CreateCommunityCommentRequest request
    ) {
        return communityService.addComment(
            user.getUserId(),
            postId,
            request.content()
        );
    }
}
