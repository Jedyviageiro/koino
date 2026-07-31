package com.koino.backend.service.GmailService;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.koino.backend.model.User;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private static final Logger logger =
        LoggerFactory.getLogger(EmailService.class);
    private static final int MAX_SEND_ATTEMPTS = 3;

    private final JavaMailSender mailSender;
    private final String from;
    private final String provider;
    private final String resendApiKey;
    private final RestClient resendClient;
    private final String appUrl;

    public EmailService(
        JavaMailSender mailSender,
        @Value("${app.mail.from}") String from,
        @Value("${app.mail.provider:smtp}") String provider,
        @Value("${app.mail.resend-api-key:}") String resendApiKey,
        @Value("${app.mail.resend-api-url:https://api.resend.com}")
            String resendApiUrl,
        @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.provider = provider.trim().toLowerCase();
        this.resendApiKey = resendApiKey.trim();
        this.appUrl = frontendUrl.replaceAll("/+$", "") + "/";
        this.resendClient = RestClient.builder()
            .baseUrl(resendApiUrl)
            .build();
    }

    @Async("mailTaskExecutor")
    public void sendEmailVerification(
        User user,
        String verificationUrl,
        Duration expiration
    ) {
        sendHtml(
            user.getEmail(),
            "Verify your Koino email address",
            template(
                "Verify your email address",
                "Welcome to Koino, " + escape(user.getFullname()) + ".",
                "Confirm your email to activate your account and begin your "
                    + "reading journey.",
                "Verify Email Address",
                verificationUrl,
                "This link expires in " + expiration.toHours() + " hours."
            )
        );
    }

    @Async("mailTaskExecutor")
    public void sendPasswordReset(
        User user,
        String resetUrl,
        Duration expiration
    ) {
        sendHtml(
            user.getEmail(),
            "Reset your Koino password",
            template(
                "Reset your password",
                "Hello " + escape(user.getFullname()) + ",",
                "We received a request to reset your Koino password. If this "
                    + "wasn't you, you can safely ignore this email.",
                "Choose a New Password",
                resetUrl,
                "This link expires in " + expiration.toMinutes() + " minutes."
            )
        );
    }

    @Async("mailTaskExecutor")
    public void sendReadingReminder(User user) {
        sendAppNotification(
            user,
            "Your Koino reading is waiting",
            "A quiet moment with the Word is still available today.",
            "Open Koino"
        );
    }

    @Async("mailTaskExecutor")
    public void sendFriendRequestReminder(User user, String requesterName) {
        sendAppNotification(
            user,
            requesterName + " added you on Koino",
            "Open Koino to review the friend request.",
            "Open Koino"
        );
    }

    @Async("mailTaskExecutor")
    public void sendBattleChallengeReminder(User user, String challengerName) {
        sendAppNotification(
            user,
            challengerName + " challenged you on Koino",
            "Your friend is waiting in Battle Space. Open Koino to respond.",
            "Open Koino"
        );
    }

    private void sendAppNotification(
        User user,
        String subject,
        String message,
        String action
    ) {
        sendHtml(
            user.getEmail(),
            subject,
            template(
                subject,
                "Hello " + escape(user.getFullname()) + ",",
                message,
                action,
                appUrl,
                "This link opens the Koino app."
            )
        );
    }

    private void sendHtml(String to, String subject, String html) {
        Exception lastFailure = null;
        String deliveryId = UUID.randomUUID().toString();
        for (int attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
            try {
                sendOnce(to, subject, html, deliveryId);
                logger.info(
                    "Email delivered to {} with {} on attempt {}",
                    maskEmail(to),
                    provider,
                    attempt
                );
                return;
            } catch (
                MessagingException
                | MailException
                | RestClientException exception
            ) {
                lastFailure = exception;
                logger.warn(
                    "Email delivery to {} with {} failed on attempt {}/{}: {}",
                    maskEmail(to),
                    provider,
                    attempt,
                    MAX_SEND_ATTEMPTS,
                    rootMessage(exception)
                );
                if (attempt < MAX_SEND_ATTEMPTS && !pauseBeforeRetry(attempt)) {
                    break;
                }
            }
        }
        throw new IllegalStateException(
            "Email delivery failed after retries",
            lastFailure
        );
    }

    private void sendOnce(
        String to,
        String subject,
        String html,
        String deliveryId
    ) throws MessagingException {
        if ("resend".equals(provider)) {
            sendWithResend(to, subject, html, deliveryId);
            return;
        }
        if (!"smtp".equals(provider)) {
            throw new IllegalStateException(
                "Unsupported mail provider: " + provider
            );
        }
        mailSender.send(createMessage(to, subject, html));
    }

    private void sendWithResend(
        String to,
        String subject,
        String html,
        String deliveryId
    ) {
        if (resendApiKey.isBlank()) {
            throw new IllegalStateException(
                "RESEND_API_KEY is required when MAIL_PROVIDER=resend"
            );
        }
        resendClient.post()
            .uri("/emails")
            .header("Authorization", "Bearer " + resendApiKey)
            .header("Idempotency-Key", deliveryId)
            .body(Map.of(
                "from", from,
                "to", List.of(to),
                "subject", subject,
                "html", html
            ))
            .retrieve()
            .toBodilessEntity();
    }

    private MimeMessage createMessage(String to, String subject, String html)
        throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        message.setFrom(from);
        message.setRecipients(jakarta.mail.Message.RecipientType.TO, to);
        message.setSubject(subject, StandardCharsets.UTF_8.name());
        message.setContent(html, "text/html; charset=UTF-8");
        return message;
    }

    private boolean pauseBeforeRetry(int attempt) {
        try {
            Thread.sleep(Duration.ofSeconds(attempt).toMillis());
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            logger.warn("Email retry interrupted");
            return false;
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "unknown recipient";
        }
        int separator = email.indexOf('@');
        String local = email.substring(0, separator);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "***" + email.substring(separator);
    }

    private String rootMessage(Throwable exception) {
        Throwable cause = exception;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        String message = cause.getMessage();
        return message == null || message.isBlank()
            ? cause.getClass().getSimpleName()
            : message;
    }

    private String template(
        String title,
        String greeting,
        String message,
        String action,
        String url,
        String securityNotice
    ) {
        return """
            <!doctype html>
            <html><body style="margin:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#17171a">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:36px 18px">
                  <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                    style="max-width:560px;width:100%%;background:#fff;border:1px solid #e4e5e8;border-radius:14px">
                    <tr><td style="padding:38px">
                      <div style="font-size:22px;font-weight:700">Koino</div>
                      <h1 style="margin:34px 0 14px;font-size:25px;line-height:1.25">%s</h1>
                      <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#555b66">%s</p>
                      <p style="margin:0;font-size:14px;line-height:1.7;color:#555b66">%s</p>
                      <p style="margin:28px 0;text-align:center">
                        <a href="%s" style="display:inline-block;background:#e8a33d;color:#fff;
                          text-decoration:none;font-size:14px;font-weight:700;padding:14px 24px;border-radius:8px">%s</a>
                      </p>
                      <p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:#777d87;
                        overflow-wrap:anywhere">Or paste this link into your browser:<br>%s</p>
                      <div style="border-top:1px solid #ececef;padding-top:20px;font-size:12px;
                        line-height:1.6;color:#686e78"><strong>Security notice</strong><br>%s
                        Never share this link with anyone.</div>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(
                escape(title),
                greeting,
                escape(message),
                escape(url),
                escape(action),
                escape(url),
                escape(securityNotice)
            );
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
