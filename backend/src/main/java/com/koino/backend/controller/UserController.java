package com.koino.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.koino.backend.dto.auth.LoginRequest;
import com.koino.backend.dto.auth.RegisterRequest;
import com.koino.backend.service.UserService;

@RequestMapping("/api/users")
@RestController
public class UserController {
    
    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<String> LoginUser(@RequestBody LoginRequest request){
        try{
            userService.loginUser(request.email(), request.password());
            return ResponseEntity.ok("User Logged In");

        } catch(IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody RegisterRequest request){
        try{
            userService.createUser(request.fullname(), request.email(), request.password());
        return ResponseEntity.ok("User registered successfully");
        
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}


