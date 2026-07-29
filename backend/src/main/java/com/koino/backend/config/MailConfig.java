package com.koino.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {
    private static final Logger logger = LoggerFactory.getLogger(MailConfig.class);

    @Bean
    public JavaMailSender javaMailSender(
        @Value("${spring.mail.host}") String host,
        @Value("${spring.mail.port}") int port,
        @Value("${spring.mail.username}") String username,
        @Value("${spring.mail.password}") String password,
        @Value("${spring.mail.properties.mail.smtp.connectiontimeout:10000}")
            int connectionTimeout,
        @Value("${spring.mail.properties.mail.smtp.timeout:10000}")
            int readTimeout,
        @Value("${spring.mail.properties.mail.smtp.writetimeout:10000}")
            int writeTimeout
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username.trim());
        sender.setPassword(normalizeAppPassword(password));
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        Properties properties = sender.getJavaMailProperties();
        properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.starttls.required", "true");
        properties.put("mail.smtp.connectiontimeout", connectionTimeout);
        properties.put("mail.smtp.timeout", readTimeout);
        properties.put("mail.smtp.writetimeout", writeTimeout);

        if (password != null && !password.equals(normalizeAppPassword(password))) {
            logger.info("Whitespace removed from the configured mail app password");
        }
        return sender;
    }

    static String normalizeAppPassword(String password) {
        return password == null ? "" : password.replaceAll("\\s+", "");
    }
}
