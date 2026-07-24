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
import com.koino.backend.dto.user.NotificationResponse;
import com.koino.backend.dto.user.ProfilePictureResponse;
import com.koino.backend.dto.user.UserStreakResponse;
import com.koino.backend.dto.user.VerseBookmarkResponse;
import com.koino.backend.model.ResetPasswordToken;
import com.koino.backend.model.User;
import com.koino.backend.service.JwtService;
import com.koino.backend.service.NotificationService;
import com.koino.backend.service.ProfilePictureService;
import com.koino.backend.service.ResetPasswordTokenService;
import com.koino.backend.service.UserService;
import com.koino.backend.service.VerseBookmarkService;

import java.util.List;

@RequestMapping("/api/users")
@RestController
public class UserController {
    
    private final UserService userService;
    private final JwtService jwtService;
    private final ResetPasswordTokenService resetPasswordTokenService;
    private final NotificationService notificationService;
    private final VerseBookmarkService bookmarkService;
    private final ProfilePictureService profilePictureService;

    public UserController(
        UserService userService,
        JwtService jwtService,
        ResetPasswordTokenService resetPasswordTokenService,
        NotificationService notificationService,
        VerseBookmarkService bookmarkService,
        ProfilePictureService profilePictureService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.resetPasswordTokenService = resetPasswordTokenService;
        this.notificationService = notificationService;
        this.bookmarkService = bookmarkService;
        this.profilePictureService = profilePictureService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request){
        try{
            User user = userService.loginUser(request.email(), request.password());
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new LoginResponse(
                user.getUserId(), token, user.getEmail(), user.getFullname()
            ));

        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request){
        try{
            User user = userService.createUser(
                request.fullname(), request.email(), request.password()
            );
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new RegisterResponse(
                user.getUserId(), token, user.getEmail(), user.getFullname()
            ));
        
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/email-exists")
    public EmailExistsResponse emailExists(@RequestParam String email) {
        return new EmailExistsResponse(userService.emailExists(email));
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<?> requestPasswordReset(
        @RequestBody ResetPasswordTokenRequest request
    ) {
        try{
            ResetPasswordToken token = resetPasswordTokenService.generateToken(request.email());
            return ResponseEntity.ok(new ResetPasswordTokenResponse(
                token.getToken(), token.getExpiresAt()
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
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

    @PutMapping("/me/bookmarks/{verseId}")
    public VerseBookmarkResponse addBookmark(
        @AuthenticationPrincipal User user,
        @PathVariable Long verseId
    ) {
        return bookmarkService.addBookmark(user.getUserId(), verseId);
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
