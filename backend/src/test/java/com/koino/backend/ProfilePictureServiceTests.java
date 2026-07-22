package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.koino.backend.dto.user.ProfilePictureResponse;
import com.koino.backend.model.User;
import com.koino.backend.repository.UserRepository;
import com.koino.backend.service.ProfilePictureService;

class ProfilePictureServiceTests {

    @Test
    void uploadsImageAndStoresCloudinaryIdentifiers() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        UserRepository repository = mock(UserRepository.class);
        User user = new User();
        user.setUserId(42L);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(repository.findById(42L)).thenReturn(Optional.of(user));
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
            "secure_url", "https://res.cloudinary.com/koino/image/upload/profile.jpg",
            "public_id", "koino/profile-pictures/user-42"
        ));
        MockMultipartFile file = new MockMultipartFile(
            "file", "profile.jpg", "image/jpeg", new byte[] {1, 2, 3}
        );

        ProfilePictureResponse response = new ProfilePictureService(
            cloudinary, repository
        ).upload(42L, file);

        assertThat(response.profilePictureUrl()).isEqualTo(user.getProfilePictureUrl());
        assertThat(response.profilePicturePublicId())
            .isEqualTo("koino/profile-pictures/user-42");
        verify(repository).save(user);
    }

    @Test
    void removesCloudinaryAssetAndClearsUserFields() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        UserRepository repository = mock(UserRepository.class);
        User user = new User();
        user.setUserId(42L);
        user.setProfilePictureUrl("https://res.cloudinary.com/profile.jpg");
        user.setProfilePicturePublicId("koino/profile-pictures/user-42");
        when(cloudinary.uploader()).thenReturn(uploader);
        when(repository.findById(42L)).thenReturn(Optional.of(user));
        when(uploader.destroy(any(String.class), anyMap()))
            .thenReturn(Map.of("result", "ok"));

        new ProfilePictureService(cloudinary, repository).remove(42L);

        assertThat(user.getProfilePictureUrl()).isNull();
        assertThat(user.getProfilePicturePublicId()).isNull();
        verify(repository).save(user);
    }

    @Test
    void rejectsNonImageFileBeforeCallingCloudinary() {
        ProfilePictureService service = new ProfilePictureService(
            mock(Cloudinary.class),
            mock(UserRepository.class)
        );
        MockMultipartFile file = new MockMultipartFile(
            "file", "notes.txt", "text/plain", new byte[] {1}
        );

        assertThatThrownBy(() -> service.upload(42L, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Only image files are allowed");
    }
}
