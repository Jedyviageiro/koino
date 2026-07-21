package com.koino.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.koino.backend.model.User;
import com.koino.backend.repository.*;



@Service
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public UserService(PasswordEncoder passwordEncoder, UserRepository userRepository){
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public void createUser(String fullname, String email, String password){
        if(userRepository.existsByEmail(email)){
            throw new IllegalArgumentException("Email already exists");
        } else{
            User user = new User();
            user.setFullname(fullname);
            user.setEmail(email);

            String hashedPassword = passwordEncoder.encode(password);
            user.setPassword(hashedPassword);
            userRepository.save(user);
        }

    }

    public User loginUser(String email, String password){
        User user = userRepository.findByEmail(email);

        if(user == null){
            throw new IllegalArgumentException("Invalid email or password");
        }

        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new IllegalArgumentException("Invalid email or password");
        }

        return user;
    }
}
