package com.koino.backend.service;

import java.io.IOException;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.koino.backend.dto.community.CommunityAuthorResponse;
import com.koino.backend.dto.community.CommunityCommentResponse;
import com.koino.backend.dto.community.CommunityPostResponse;
import com.koino.backend.dto.community.CommunityVerseResponse;
import com.koino.backend.dto.community.CreateCommunityPostRequest;
import com.koino.backend.model.CommunityComment;
import com.koino.backend.model.CommunityPost;
import com.koino.backend.model.CommunityPostType;
import com.koino.backend.model.User;
import com.koino.backend.model.AccountStatus;
import com.koino.backend.model.Verse;
import com.koino.backend.repository.CommunityCommentRepository;
import com.koino.backend.repository.CommunityPostRepository;
import com.koino.backend.repository.ContentReportRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.repository.VerseRepository;

@Service
public class CommunityService {
    private static final long MAX_PHOTO_SIZE = 8L * 1024 * 1024;
    private static final String PHOTO_FOLDER = "koino/community";

    private final CommunityPostRepository postRepository;
    private final ContentReportRepository reportRepository;
    private final CommunityCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final VerseRepository verseRepository;
    private final Cloudinary cloudinary;
    private final TrustSafetyService trustSafetyService;
    private final ContentModerationService contentModerationService;

    public CommunityService(
        CommunityPostRepository postRepository,
        ContentReportRepository reportRepository,
        CommunityCommentRepository commentRepository,
        UserRepository userRepository,
        VerseRepository verseRepository,
        Cloudinary cloudinary,
        TrustSafetyService trustSafetyService,
        ContentModerationService contentModerationService
    ) {
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.verseRepository = verseRepository;
        this.cloudinary = cloudinary;
        this.trustSafetyService = trustSafetyService;
        this.contentModerationService = contentModerationService;
    }

    @Transactional(readOnly = true)
    public List<CommunityPostResponse> getFeed(Long userId, String type) {
        List<CommunityPost> posts = parseType(type)
            .map(postRepository::findTop50ByPostTypeOrderByCreatedAtDesc)
            .orElseGet(postRepository::findTop50ByOrderByCreatedAtDesc);

        posts = posts.stream().filter(post -> post.getAuthor().isActive()
            && post.getAuthor().getAccountStatus() != AccountStatus.BANNED).toList();
        if (posts.isEmpty()) {
            return List.of();
        }

        List<Long> postIds = posts.stream().map(CommunityPost::getPostId).toList();
        Map<Long, List<CommunityComment>> commentsByPost =
            commentRepository.findByPostPostIdInOrderByCreatedAtAsc(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                    comment -> comment.getPost().getPostId()
                ));

        return posts.stream()
            .map(post -> toResponse(
                post,
                commentsByPost.getOrDefault(post.getPostId(), List.of())
            ))
            .toList();
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        CommunityPost post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!post.getAuthor().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Only the author can delete this post");
        }
        commentRepository.deleteByPostPostId(postId);
        reportRepository.clearPostReference(postId);
        postRepository.delete(post);
        if (post.getPhotoPublicId() != null && !post.getPhotoPublicId().isBlank()) {
            try {
                cloudinary.uploader().destroy(post.getPhotoPublicId(), ObjectUtils.emptyMap());
            } catch (IOException ignored) {
                // The database deletion must not be reversed by storage cleanup.
            }
        }
    }

    @Transactional
    public CommunityPostResponse createPost(
        Long userId,
        CreateCommunityPostRequest request
    ) {
        if (request.postType() == CommunityPostType.PHOTO) {
            throw new IllegalArgumentException(
                "Photo posts must include an image upload"
            );
        }

        CommunityPost post = new CommunityPost();
        post.setAuthor(findUser(userId));
        post.setPostType(request.postType());
        post.setContent(clean(request.content()));

        if (request.postType() == CommunityPostType.VERSE) {
            if (request.verseId() == null) {
                throw new IllegalArgumentException("Select a Bible verse to share");
            }
            post.setVerse(verseRepository.findById(request.verseId())
                .orElseThrow(() -> new IllegalArgumentException("Verse not found")));
        } else {
            requireContent(post.getContent(), "Write your question before posting");
            if (request.verseId() != null) {
                throw new IllegalArgumentException(
                    "A question post cannot include a verse"
                );
            }
        }

        return toResponse(postRepository.save(post), List.of());
    }

    @Transactional
    public CommunityPostResponse createPhotoPost(
        Long userId,
        MultipartFile file,
        String caption
    ) {
        validatePhoto(file);
        User author = findUser(userId);
        String cleanedCaption = clean(caption);
        if (cleanedCaption != null && cleanedCaption.length() > 1200) {
            throw new IllegalArgumentException(
                "Photo caption must be 1200 characters or fewer"
            );
        }

        try {
            byte[] bytes = file.getBytes();
            ContentModerationService.ModerationResult moderation = contentModerationService.reviewImage(bytes, file.getContentType(), cleanedCaption);
            if (!moderation.allowed()) {
                if (moderation.confidence() >= .75) trustSafetyService.recordAutomatedViolation(userId, moderation.reason(), moderation.confidence(), moderation.severe());
                throw new IllegalArgumentException("This photo cannot be shared because it may violate the community guidelines. It was not published.");
            }
            Map<?, ?> upload = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", PHOTO_FOLDER,
                    "unique_filename", true,
                    "overwrite", false
                )
            );

            CommunityPost post = new CommunityPost();
            post.setAuthor(author);
            post.setPostType(CommunityPostType.PHOTO);
            post.setContent(cleanedCaption);
            post.setPhotoUrl(requiredUploadValue(upload, "secure_url"));
            post.setPhotoPublicId(requiredUploadValue(upload, "public_id"));
            return toResponse(postRepository.save(post), List.of());
        } catch (IOException exception) {
            throw new IllegalStateException(
                "Could not upload the community photo",
                exception
            );
        }
    }

    @Transactional
    public CommunityCommentResponse addComment(
        Long userId,
        Long postId,
        String content
    ) {
        String cleanedContent = clean(content);
        requireContent(cleanedContent, "Write a comment before posting");

        CommunityComment comment = new CommunityComment();
        comment.setAuthor(findUser(userId));
        comment.setPost(postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found")));
        comment.setContent(cleanedContent);
        return toCommentResponse(commentRepository.save(comment));
    }

    private java.util.Optional<CommunityPostType> parseType(String type) {
        if (type == null || type.isBlank() || type.equalsIgnoreCase("ALL")) {
            return java.util.Optional.empty();
        }
        try {
            return java.util.Optional.of(
                CommunityPostType.valueOf(type.trim().toUpperCase())
            );
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                "Community type must be VERSE, PHOTO, or QUESTION"
            );
        }
    }

    private CommunityPostResponse toResponse(
        CommunityPost post,
        List<CommunityComment> comments
    ) {
        return new CommunityPostResponse(
            post.getPostId(),
            toAuthorResponse(post.getAuthor()),
            post.getPostType(),
            post.getContent(),
            post.getVerse() == null ? null : toVerseResponse(post.getVerse()),
            post.getPhotoUrl(),
            post.getCreatedAt().toInstant(ZoneOffset.UTC),
            comments.stream()
                .filter(comment -> comment.getAuthor().isActive()
                    && comment.getAuthor().getAccountStatus() != AccountStatus.BANNED)
                .map(this::toCommentResponse).toList()
        );
    }

    private CommunityVerseResponse toVerseResponse(Verse verse) {
        String reference = "%s %d:%d".formatted(
            verse.getChapter().getBook().getTitle(),
            verse.getChapter().getChapterNumber(),
            verse.getVerseNumber()
        );
        return new CommunityVerseResponse(
            verse.getVerseId(),
            reference,
            verse.getText()
        );
    }

    private CommunityCommentResponse toCommentResponse(CommunityComment comment) {
        return new CommunityCommentResponse(
            comment.getCommentId(),
            toAuthorResponse(comment.getAuthor()),
            comment.getContent(),
            comment.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }

    private CommunityAuthorResponse toAuthorResponse(User user) {
        boolean active = user.isActive();
        return new CommunityAuthorResponse(
            user.getUserId(),
            active ? user.getFullname() : "Deleted Account",
            active ? user.getProfilePictureUrl() : null,
            active
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private void requireContent(String content, String message) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private void validatePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo to post");
        }
        if (file.getSize() > MAX_PHOTO_SIZE) {
            throw new IllegalArgumentException("Photo must be 8 MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {
            throw new IllegalArgumentException("Please choose a JPG, PNG, or WebP image.");
        }
    }

    private String requiredUploadValue(Map<?, ?> upload, String key) {
        Object value = upload.get(key);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalStateException(
                "Cloudinary response did not contain " + key
            );
        }
        return value.toString();
    }
}
