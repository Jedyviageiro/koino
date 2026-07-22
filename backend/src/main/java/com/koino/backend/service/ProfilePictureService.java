package com.koino.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.koino.backend.dto.user.ProfilePictureResponse;
import com.koino.backend.model.User;
import com.koino.backend.repository.UserRepository;

@Service
public class ProfilePictureService {
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final String PROFILE_FOLDER = "koino/profile-pictures";

    private final Cloudinary cloudinary;
    private final UserRepository userRepository;

    public ProfilePictureService(Cloudinary cloudinary, UserRepository userRepository) {
        this.cloudinary = cloudinary;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProfilePictureResponse upload(Long userId, MultipartFile file) {
        validateImage(file);
        User user = findUser(userId);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", PROFILE_FOLDER,
                    "public_id", "user-" + userId,
                    "overwrite", true,
                    "invalidate", true
                )
            );
            String secureUrl = requiredResult(result, "secure_url");
            String publicId = requiredResult(result, "public_id");

            user.setProfilePictureUrl(secureUrl);
            user.setProfilePicturePublicId(publicId);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            return new ProfilePictureResponse(secureUrl, publicId);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not upload profile picture", exception);
        }
    }

    @Transactional
    public void remove(Long userId) {
        User user = findUser(userId);
        String publicId = user.getProfilePicturePublicId();

        if (publicId != null && !publicId.isBlank()) {
            try {
                cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", "image", "invalidate", true)
                );
            } catch (IOException exception) {
                throw new IllegalStateException("Could not remove profile picture", exception);
            }
        }

        user.setProfilePictureUrl(null);
        user.setProfilePicturePublicId(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("No user found"));
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile picture is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Profile picture must be 5 MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
    }

    private String requiredResult(Map<?, ?> result, String key) {
        Object value = result.get(key);
        if (value == null || value.toString().isBlank()) {
            throw new IllegalStateException("Cloudinary response did not contain " + key);
        }
        return value.toString();
    }
}
