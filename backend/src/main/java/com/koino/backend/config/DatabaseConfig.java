package com.koino.backend.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import javax.sql.DataSource;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource(Environment environment) {
        String renderUrl = environment.getProperty("DATABASE_URL");
        if (renderUrl == null || renderUrl.isBlank()) {
            return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(environment.getRequiredProperty("spring.datasource.url"))
                .username(environment.getRequiredProperty(
                    "spring.datasource.username"
                ))
                .password(environment.getRequiredProperty(
                    "spring.datasource.password"
                ))
                .build();
        }

        URI uri = URI.create(renderUrl);
        String[] credentials = uri.getRawUserInfo().split(":", 2);
        String username = decode(credentials[0]);
        String password = credentials.length > 1
            ? decode(credentials[1])
            : "";
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String jdbcUrl = "jdbc:postgresql://"
            + uri.getHost()
            + ":" + port
            + uri.getPath()
            + (
                uri.getRawQuery() == null
                    ? ""
                    : "?" + uri.getRawQuery()
            );

        return DataSourceBuilder.create()
            .driverClassName("org.postgresql.Driver")
            .url(jdbcUrl)
            .username(username)
            .password(password)
            .build();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
