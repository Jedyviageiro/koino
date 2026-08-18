package com.koino.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Locale;
import java.text.Normalizer;
import java.security.SecureRandom;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.koino.backend.model.User;
import com.koino.backend.dto.user.UserStreakResponse;
import com.koino.backend.dto.user.UserStreakDayResponse;
import com.koino.backend.dto.user.UserSettingsRequest;
import com.koino.backend.dto.user.UserSettingsResponse;
import com.koino.backend.model.UserLoginDay;
import com.koino.backend.repository.UserLoginDayRepository;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.repository.UserProfileRepository;
import com.koino.backend.model.UserProfile;



@Service
public class UserService {
    private static final SecureRandom FRIEND_CODE_RANDOM = new SecureRandom();
    private static final char[] FRIEND_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserLoginDayRepository loginDayRepository;
    private final UserProfileRepository userProfileRepository;

    public UserService(
        PasswordEncoder passwordEncoder,
        UserRepository userRepository,
        UserLoginDayRepository loginDayRepository,
        UserProfileRepository userProfileRepository
    ){
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.loginDayRepository = loginDayRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public User createUser(String fullname, String email, String password){
        return createUser(fullname, email, password, true);
    }

    public User createPendingUser(
        String fullname,
        String email,
        String password,
        String language
    ) {
        com.koino.backend.utils.PasswordPolicy.requireStrong(password);
        User user = createUser(fullname, email, password, false);
        user.setLanguage(normalizeLanguage(language));
        return userRepository.save(user);
    }

    private User createUser(
        String fullname,
        String email,
        String password,
        boolean emailVerified
    ){
        String normalizedEmail = normalizeEmail(email);
        if(userRepository.existsByEmail(normalizedEmail)){
            throw new IllegalArgumentException("Email already in use");
        } else{
            User user = new User();
            user.setFullname(fullname == null ? "" : fullname.trim());
            user.setEmail(normalizedEmail);
            user.setEmailVerified(emailVerified);
            user.setUsername(generateUsername(user.getFullname()));
            user.setFriendCode(generateFriendCode());

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
        User user = userRepository.findByEmail(normalizeEmail(email));

        if(user == null || !user.isActive()){
            throw new IllegalArgumentException("Invalid email or password");
        }

        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new IllegalArgumentException("Invalid email or password");
        }
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException(
                "Please verify your email address before logging in"
            );
        }

        recordLogin(user, LocalDate.now());
        return user;
    }

    @Transactional
    public User loginGoogleUser(
        String email,
        String fullname,
        String pictureUrl,
        String language
    ) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail);
        if (user == null) {
            user = new User();
            user.setEmail(normalizedEmail);
            user.setFullname(
                fullname == null || fullname.isBlank()
                    ? normalizedEmail.substring(0, normalizedEmail.indexOf('@'))
                    : fullname.trim()
            );
            user.setPassword(passwordEncoder.encode(
                java.util.UUID.randomUUID() + "Gg!"
            ));
            user.setUsername(generateUsername(user.getFullname()));
            user.setFriendCode(generateFriendCode());
            user.setCreatedAt(LocalDateTime.now());
            user.setLanguage(normalizeLanguage(language));
        }
        if (!user.isActive()) {
            throw new IllegalArgumentException("This account is deactivated");
        }
        user.setEmailVerified(true);
        if (pictureUrl != null && !pictureUrl.isBlank()
            && user.getProfilePictureUrl() == null) {
            user.setProfilePictureUrl(pictureUrl);
        }
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        recordLogin(user, LocalDate.now());
        return user;
    }

    private String normalizeLanguage(String language) {
        return language != null && language.toLowerCase(Locale.ROOT).startsWith("pt")
            ? "pt"
            : "en";
    }

    @Transactional
    public UserStreakResponse getStreak(Long userId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now();
        recordLogin(user, today);
        restoreCurrentStreakHistory(user);
        LocalDate startDate = today.minusDays(6);
        Set<LocalDate> activeDates = loginDayRepository
            .findByUserUserIdAndLoginDateBetweenOrderByLoginDateAsc(
                userId,
                startDate,
                today
            )
            .stream()
            .map(UserLoginDay::getLoginDate)
            .collect(Collectors.toSet());
        var recentDays = startDate.datesUntil(today.plusDays(1))
            .map(date -> new UserStreakDayResponse(
                date,
                activeDates.contains(date)
            ))
            .toList();
        return new UserStreakResponse(
            user.getCurrentStreak(),
            user.getLongestStreak(),
            user.getLastLoginDate(),
            recentDays
        );
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(normalizeEmail(email));
    }

    public User findByEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return userRepository.findByEmail(normalizeEmail(email));
    }

    @Transactional
    public UserSettingsResponse getSettings(Long userId) {
        User user = ensurePrivateIdentity(ensureUsername(findUser(userId)));
        return toSettingsResponse(user);
    }

    @Transactional
    public UserSettingsResponse updateSettings(
        Long userId,
        UserSettingsRequest request
    ) {
        User user = findUser(userId);
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailAndUserIdNot(email, userId)) {
            throw new IllegalArgumentException("Email already exists");
        }
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (
            userRepository.existsByUsernameIgnoreCaseAndUserIdNot(
                username,
                userId
            )
        ) {
            throw new IllegalArgumentException("Username already in use");
        }

        try {
            ZoneId.of(request.timeZone());
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("Unknown time zone");
        }
        if (!Set.of("en", "pt").contains(request.language())) {
            throw new IllegalArgumentException("Unsupported language");
        }

        user.setFullname(request.fullname().trim());
        user.setEmail(email);
        user.setUsername(username);
        user.setTimeZone(request.timeZone());
        user.setLanguage(request.language());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        User savedUser = user;
        UserProfile profile = userProfileRepository
            .findByUserUserId(userId)
            .orElseGet(() -> {
                UserProfile created = new UserProfile();
                created.setUser(savedUser);
                return created;
            });
        profile.setBio(cleanOptional(request.bio()));
        profile.setLocation(cleanOptional(request.location()));
        String countryCode = cleanOptional(request.countryCode());
        profile.setCountryCode(
            countryCode == null ? null : countryCode.toUpperCase(Locale.ROOT)
        );
        userProfileRepository.save(profile);
        return toSettingsResponse(user);
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
        recordLoginDay(user, today);
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

    private void restoreCurrentStreakHistory(User user) {
        LocalDate lastLoginDate = user.getLastLoginDate();
        if (lastLoginDate == null || user.getCurrentStreak() <= 0) {
            return;
        }

        for (int offset = 0; offset < user.getCurrentStreak(); offset++) {
            recordLoginDay(user, lastLoginDate.minusDays(offset));
        }
    }

    private void recordLoginDay(User user, LocalDate date) {
        if (loginDayRepository.existsByUserUserIdAndLoginDate(
            user.getUserId(),
            date
        )) {
            return;
        }
        UserLoginDay loginDay = new UserLoginDay();
        loginDay.setUser(user);
        loginDay.setLoginDate(date);
        loginDayRepository.save(loginDay);
    }

    private UserSettingsResponse toSettingsResponse(User user) {
        UserProfile profile = userProfileRepository.findByUserUserId(
            user.getUserId()
        ).orElse(null);
        return new UserSettingsResponse(
            user.getUserId(),
            user.getFullname(),
            user.getEmail(),
            user.getTimeZone(),
            user.getLanguage(),
            user.getProfilePictureUrl(),
            user.getUsername(),
            profile == null ? null : profile.getBio(),
            profile == null ? null : profile.getLocation(),
            profile == null ? null : profile.getCountryCode(),
            user.getFriendCode()
        );
    }

    @Transactional
    public User ensurePrivateIdentity(User user) {
        if (user.getFriendCode() != null && !user.getFriendCode().isBlank()) {
            return user;
        }
        user.setFriendCode(generateFriendCode());
        return userRepository.save(user);
    }

    @Transactional
    public User ensureUsername(User user) {
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user;
        }
        user.setUsername(generateUsername(user.getFullname()));
        return userRepository.save(user);
    }

    private String generateUsername(String fullname) {
        String base = Normalizer.normalize(
            fullname == null ? "" : fullname,
            Normalizer.Form.NFD
        )
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", ".")
            .replaceAll("^\\.+|\\.+$", "");
        if (base.length() < 3) {
            base = "reader";
        }
        if (base.length() > 32) {
            base = base.substring(0, 32).replaceAll("\\.+$", "");
        }
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }

    private String generateFriendCode() {
        String candidate;
        do {
            StringBuilder value = new StringBuilder(9);
            for (int index = 0; index < 8; index++) {
                if (index == 4) value.append('-');
                value.append(FRIEND_CODE_ALPHABET[FRIEND_CODE_RANDOM.nextInt(FRIEND_CODE_ALPHABET.length)]);
            }
            candidate = value.toString();
        } while (userRepository.existsByFriendCodeIgnoreCase(candidate));
        return candidate;
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

}
