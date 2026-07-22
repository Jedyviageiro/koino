package com.koino.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.User;
import com.koino.backend.dto.user.UserStreakResponse;
import com.koino.backend.repository.UserRepository;



@Service
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public UserService(PasswordEncoder passwordEncoder, UserRepository userRepository){
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public User createUser(String fullname, String email, String password){
        if(userRepository.existsByEmail(email)){
            throw new IllegalArgumentException("Email already exists");
        } else{
            User user = new User();
            user.setFullname(fullname);
            user.setEmail(email);

            String hashedPassword = passwordEncoder.encode(password);
            user.setPassword(hashedPassword);
            LocalDateTime now = LocalDateTime.now();
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            return userRepository.save(user);
        }
    }

    @Transactional
    public User loginUser(String email, String password){
        User user = userRepository.findByEmail(email);

        if(user == null || !user.isActive()){
            throw new IllegalArgumentException("Invalid email or password");
        }

        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new IllegalArgumentException("Invalid email or password");
        }

        recordLogin(user, LocalDate.now());
        return user;
    }

    public UserStreakResponse getStreak(Long userId) {
        User user = findUser(userId);
        return new UserStreakResponse(
            user.getCurrentStreak(),
            user.getLongestStreak(),
            user.getLastLoginDate()
        );
    }

    @Transactional
    public void deactivateUser(Long userId){
        User user = findUser(userId);

        if (!user.isActive()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        user.setActive(false);
        user.setDeactivatedAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("No user found"));
    }

    private void recordLogin(User user, LocalDate today) {
        LocalDate previousLogin = user.getLastLoginDate();
        if (today.equals(previousLogin)) {
            return;
        }

        int currentStreak = previousLogin != null && previousLogin.equals(today.minusDays(1))
            ? user.getCurrentStreak() + 1
            : 1;
        user.setCurrentStreak(currentStreak);
        user.setLongestStreak(Math.max(user.getLongestStreak(), currentStreak));
        user.setLastLoginDate(today);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

}
