package com.koino.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

import com.koino.backend.dto.auth.LoginRequest;
import com.koino.backend.dto.auth.LoginResponse;
import com.koino.backend.dto.auth.EmailExistsResponse;
import com.koino.backend.dto.auth.RegisterRequest;
import com.koino.backend.dto.auth.RegisterResponse;
import com.koino.backend.dto.auth.ResetPasswordTokenRequest;
import com.koino.backend.dto.auth.ResetPasswordTokenResponse;
import com.koino.backend.dto.auth.SaveNewPasswordRequest;
import com.koino.backend.dto.auth.EmailVerificationConfirmRequest;
import com.koino.backend.dto.auth.EmailVerificationRequest;
import com.koino.backend.dto.auth.GoogleLoginRequest;
import com.koino.backend.dto.user.NotificationResponse;
import com.koino.backend.dto.user.BookmarkVerseRequest;
import com.koino.backend.dto.user.ProfilePictureResponse;
import com.koino.backend.dto.user.UserStreakResponse;
import com.koino.backend.dto.user.UserSummaryResponse;
import com.koino.backend.dto.user.UserSettingsRequest;
import com.koino.backend.dto.user.UserSettingsResponse;
import com.koino.backend.dto.user.VerseBookmarkResponse;
import com.koino.backend.model.User;
import com.koino.backend.service.JwtService;
import com.koino.backend.service.NotificationService;
import com.koino.backend.service.ProfilePictureService;
import com.koino.backend.service.ResetPasswordTokenService;
import com.koino.backend.service.UserService;
import com.koino.backend.service.VerseBookmarkService;
import com.koino.backend.service.EmailVerificationService;
import com.koino.backend.service.GoogleIdentityService;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/users")
@RestController
public class UserController {
    
    private final UserService userService;
    private final JwtService jwtService;
    private final ResetPasswordTokenService resetPasswordTokenService;
    private final NotificationService notificationService;
    private final VerseBookmarkService bookmarkService;
    private final ProfilePictureService profilePictureService;
    private final EmailVerificationService emailVerificationService;
    private final GoogleIdentityService googleIdentityService;

    public UserController(
        UserService userService,
        JwtService jwtService,
        ResetPasswordTokenService resetPasswordTokenService,
        NotificationService notificationService,
        VerseBookmarkService bookmarkService,
        ProfilePictureService profilePictureService,
        EmailVerificationService emailVerificationService,
        GoogleIdentityService googleIdentityService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.resetPasswordTokenService = resetPasswordTokenService;
        this.notificationService = notificationService;
        this.bookmarkService = bookmarkService;
        this.profilePictureService = profilePictureService;
        this.emailVerificationService = emailVerificationService;
        this.googleIdentityService = googleIdentityService;
    }

    @GetMapping("/google/config")
    public Map<String, String> googleConfig() {
        return Map.of("clientId", googleIdentityService.getClientId());
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(
        @Valid @RequestBody GoogleLoginRequest request
    ) {
        try {
            User user = googleIdentityService.authenticate(request.credential());
            return ResponseEntity.ok(new LoginResponse(
                user.getUserId(),
                jwtService.generateToken(user),
                user.getEmail(),
                user.getFullname(),
                user.getProfilePictureUrl()
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request){
        try{
            User user = userService.loginUser(request.email(), request.password());
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new LoginResponse(
                user.getUserId(),
                token,
                user.getEmail(),
                user.getFullname(),
                user.getProfilePictureUrl()
            ));

        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
        @Valid @RequestBody RegisterRequest request
    ){
        try{
            User user = userService.createPendingUser(
                request.fullname(), request.email(), request.password()
            );
            emailVerificationService.sendVerification(user);
            return ResponseEntity.ok(new RegisterResponse(
                user.getUserId(),
                user.getEmail(),
                user.getFullname(),
                true
            ));
        
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-email/resend")
    public ResponseEntity<Map<String, String>> resendVerification(
        @Valid @RequestBody EmailVerificationRequest request
    ) {
        emailVerificationService.resend(request.email());
        return ResponseEntity.accepted().body(Map.of(
            "message",
            "If the account is awaiting verification, a new email has been sent."
        ));
    }

    @PostMapping("/verify-email/confirm")
    public ResponseEntity<Map<String, String>> confirmEmail(
        @Valid @RequestBody EmailVerificationConfirmRequest request
    ) {
        emailVerificationService.confirm(request.token());
        return ResponseEntity.ok(Map.of(
            "message",
            "Your email is verified. You can now log in."
        ));
    }

    @GetMapping("/email-exists")
    public EmailExistsResponse emailExists(@RequestParam String email) {
        return new EmailExistsResponse(userService.emailExists(email));
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<?> requestPasswordReset(
        @Valid @RequestBody ResetPasswordTokenRequest request
    ) {
        try {
            resetPasswordTokenService.generateToken(request.email());
        } catch (IllegalArgumentException ignored) {
            // Always return the same response so account existence is not disclosed.
        }
        return ResponseEntity.accepted().body(new ResetPasswordTokenResponse(
            "If an account exists for that email, a reset link has been sent."
        ));
    }

    @PostMapping("/resetPassword/confirm")
    public ResponseEntity<Void> saveNewPassword(
        @Valid @RequestBody SaveNewPasswordRequest request
    ) {
        resetPasswordTokenService.saveNewPassword(
            request.newPassword(),
            request.confirmPassword(),
            request.token()
        );
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/deactivate")
    public ResponseEntity<Void> deactivateUser(@AuthenticationPrincipal User user) {
        userService.deactivateUser(user.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserSummaryResponse getCurrentUser(
        @AuthenticationPrincipal User user
    ) {
        return new UserSummaryResponse(
            user.getUserId(),
            user.getEmail(),
            user.getFullname(),
            user.getProfilePictureUrl()
        );
    }

    @PutMapping(
        value = "/me/profile-picture",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ProfilePictureResponse updateProfilePicture(
        @AuthenticationPrincipal User user,
        @RequestPart("file") MultipartFile file
    ) {
        return profilePictureService.upload(user.getUserId(), file);
    }

    @DeleteMapping("/me/profile-picture")
    public ResponseEntity<Void> removeProfilePicture(@AuthenticationPrincipal User user) {
        profilePictureService.remove(user.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/streak")
    public UserStreakResponse getStreak(@AuthenticationPrincipal User user) {
        return userService.getStreak(user.getUserId());
    }

    @GetMapping("/me/notifications")
    public List<NotificationResponse> getNotifications(@AuthenticationPrincipal User user) {
        return notificationService.getNotifications(user.getUserId());
    }

    @PatchMapping("/me/notifications/{notificationId}/read")
    public NotificationResponse markNotificationRead(
        @AuthenticationPrincipal User user,
        @PathVariable Long notificationId
    ) {
        return notificationService.markRead(user.getUserId(), notificationId);
    }

    @PatchMapping("/me/notifications/read")
    public ResponseEntity<Void> markAllNotificationsRead(
        @AuthenticationPrincipal User user
    ) {
        notificationService.markAllRead(user.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/settings")
    public UserSettingsResponse getSettings(@AuthenticationPrincipal User user) {
        return userService.getSettings(user.getUserId());
    }

    @PatchMapping("/me/settings")
    public UserSettingsResponse updateSettings(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody UserSettingsRequest request
    ) {
        return userService.updateSettings(user.getUserId(), request);
    }

    @PutMapping("/me/bookmarks/{verseId}")
    public VerseBookmarkResponse addBookmark(
        @AuthenticationPrincipal User user,
        @PathVariable Long verseId,
        @Valid @RequestBody(required = false) BookmarkVerseRequest request
    ) {
        return bookmarkService.addBookmark(
            user.getUserId(),
            verseId,
            request == null ? null : request.highlightColor()
        );
    }

    @GetMapping("/me/bookmarks")
    public List<VerseBookmarkResponse> getBookmarks(@AuthenticationPrincipal User user) {
        return bookmarkService.getBookmarks(user.getUserId());
    }

    @DeleteMapping("/me/bookmarks/{verseId}")
    public ResponseEntity<Void> removeBookmark(
        @AuthenticationPrincipal User user,
        @PathVariable Long verseId
    ) {
        bookmarkService.removeBookmark(user.getUserId(), verseId);
        return ResponseEntity.noContent().build();
    }

}
