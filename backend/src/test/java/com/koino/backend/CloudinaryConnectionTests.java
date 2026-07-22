package com.koino.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.cloudinary.Cloudinary;

class CloudinaryConnectionTests {

    @Test
    @EnabledIfEnvironmentVariable(named = "CLOUDINARY_URL", matches = ".+")
    void authenticatesWithConfiguredCloudinaryAccount() throws Exception {
        Cloudinary cloudinary = new Cloudinary(System.getenv("CLOUDINARY_URL"));

        Map<?, ?> response = cloudinary.api().ping(Map.of());

        assertThat(response.get("status")).isEqualTo("ok");
    }
}
