package com.koino.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.auth.LoginRequest;
import com.koino.backend.dto.auth.LoginResponse;
import com.koino.backend.dto.auth.RegisterRequest;
import com.koino.backend.dto.auth.RegisterResponse;
import com.koino.backend.dto.auth.ResetPasswordTokenRequest;
import com.koino.backend.dto.auth.ResetPasswordTokenResponse;
import com.koino.backend.model.ResetPasswordToken;
import com.koino.backend.model.User;
import com.koino.backend.service.JwtService;
import com.koino.backend.service.ResetPasswordTokenService;
import com.koino.backend.service.UserService;

@RequestMapping("/api/users")
@RestController
public class UserController {
    
    private final UserService userService;
    private final JwtService jwtService;
    private final ResetPasswordTokenService resetPasswordTokenService;

    public UserController(
        UserService userService,
        JwtService jwtService,
        ResetPasswordTokenService resetPasswordTokenService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.resetPasswordTokenService = resetPasswordTokenService;
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

}


