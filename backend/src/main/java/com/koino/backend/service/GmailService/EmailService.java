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
            "Confirm your Koino email",
            verificationTemplate(
                user.getFullname(),
                verificationUrl,
                expiration
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
            actionTemplate(
                "Reset your password",
                "Hello " + escape(user.getFullname()) + ",",
                "We received a request to reset your Koino password. If this "
                    + "wasn't you, you can safely ignore this email.",
                "Choose a New Password",
                resetUrl,
                "This secure link expires in " + expiration.toMinutes()
                    + " minutes."
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
            "You have a new friend request",
            requesterName + " wants to connect with you on Koino.",
            "View Request"
        );
    }

    @Async("mailTaskExecutor")
    public void sendBattleChallengeReminder(User user, String challengerName) {
        sendAppNotification(
            user,
            "A Battle Space challenge is waiting",
            challengerName + " challenged you. Open Koino to respond.",
            "View Challenge"
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
            notificationTemplate(
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

    private String verificationTemplate(
        String name,
        String url,
        Duration expiration
    ) {
        String body = """
            <tr><td style="padding:0 34px 30px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="overflow:hidden;border:1px solid #eee8df;border-radius:14px;background:#ffffff">
                <tr><td>
                  <img src="{{ART_URL}}" width="560" alt="Koino email confirmation"
                    style="display:block;width:100%;height:auto;max-height:280px;object-fit:cover;border:0">
                </td></tr>
                <tr><td style="padding:30px 34px 32px">
                  <h1 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;
                    font-size:28px;font-weight:500;line-height:1.2;color:#191816">Confirm your email</h1>
                  <p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#686b67">
                    Hi {{NAME}},</p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#686b67">
                    Thanks for joining Koino. Confirm your email address to activate your
                    personalized reading experience.</p>
                  {{ACTION}}
                  <p style="margin:14px 0 0;text-align:center;font-size:10px;line-height:1.6;
                    color:#8a8c87">This secure link expires in {{HOURS}} hours.</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 34px 30px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border-radius:12px;background:#faf7f2">
                <tr>
                  <td width="33%" align="center" style="padding:20px 8px;color:#555953">
                    <div style="font-size:19px;color:#cf8a28">&#9634;</div>
                    <strong style="display:block;margin-top:7px;font-size:11px">Grow in faith</strong>
                    <span style="font-size:9px;color:#8a8d87">Daily devotionals</span>
                  </td>
                  <td width="34%" align="center" style="padding:20px 8px;border-left:1px solid #eee8df;
                    border-right:1px solid #eee8df;color:#555953">
                    <div style="font-size:19px;color:#cf8a28">&#9675;</div>
                    <strong style="display:block;margin-top:7px;font-size:11px">Track progress</strong>
                    <span style="font-size:9px;color:#8a8d87">Build steady habits</span>
                  </td>
                  <td width="33%" align="center" style="padding:20px 8px;color:#555953">
                    <div style="font-size:19px;color:#cf8a28">&#9734;</div>
                    <strong style="display:block;margin-top:7px;font-size:11px">Stay inspired</strong>
                    <span style="font-size:9px;color:#8a8d87">Read, learn, connect</span>
                  </td>
                </tr>
              </table>
            </td></tr>
            """
            .replace("{{ART_URL}}", escape(appUrl + "confirm-email-artwork.png"))
            .replace("{{NAME}}", escape(displayName(name)))
            .replace("{{HOURS}}", Long.toString(expiration.toHours()))
            .replace("{{ACTION}}", actionButton("Confirm My Email", url));
        return emailShell("Confirm your Koino email", body);
    }

    private String actionTemplate(
        String title,
        String greeting,
        String message,
        String action,
        String url,
        String securityNotice
    ) {
        String body = """
            <tr><td style="padding:0 34px 34px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #eee8df;border-radius:14px;background:#ffffff">
                <tr><td style="padding:38px 36px">
                  <div style="display:inline-block;padding:10px 12px;border-radius:50%;
                    background:#fff4e2;color:#cb8421;font-size:20px">&#10022;</div>
                  <h1 style="margin:24px 0 12px;font-family:Georgia,'Times New Roman',serif;
                    font-size:28px;font-weight:500;line-height:1.2;color:#191816">{{TITLE}}</h1>
                  <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#686b67">{{GREETING}}</p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#686b67">{{MESSAGE}}</p>
                  {{ACTION}}
                  <div style="margin-top:18px;padding:14px 16px;border-radius:9px;background:#faf7f2;
                    font-size:10px;line-height:1.6;color:#7a7d77">{{NOTICE}}
                    Never share this link with anyone.</div>
                  <p style="margin:18px 0 0;font-size:9px;line-height:1.6;color:#989a96;
                    overflow-wrap:anywhere">If the button does not work, paste this link into your browser:<br>{{URL}}</p>
                </td></tr>
              </table>
            </td></tr>
            """
            .replace("{{TITLE}}", escape(title))
            .replace("{{GREETING}}", greeting)
            .replace("{{MESSAGE}}", escape(message))
            .replace("{{ACTION}}", actionButton(action, url))
            .replace("{{NOTICE}}", escape(securityNotice) + " ")
            .replace("{{URL}}", escape(url));
        return emailShell(title, body);
    }

    private String notificationTemplate(
        String title,
        String greeting,
        String message,
        String action,
        String url,
        String notice
    ) {
        String body = """
            <tr><td style="padding:0 34px 34px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #eee8df;border-radius:14px;background:#fbf7f0">
                <tr><td align="center" style="padding:44px 34px 38px">
                  <div style="display:inline-block;width:70px;height:70px;line-height:70px;border-radius:50%;
                    background:#f1dfbf;color:#c98522;font-size:30px">&#10022;</div>
                  <h1 style="margin:24px 0 10px;font-family:Georgia,'Times New Roman',serif;
                    font-size:27px;font-weight:500;line-height:1.25;color:#191816">{{TITLE}}</h1>
                  <p style="margin:0 0 5px;font-size:12px;line-height:1.7;color:#6c706a">{{GREETING}}</p>
                  <p style="margin:0;font-size:12px;line-height:1.7;color:#6c706a">{{MESSAGE}}</p>
                  {{ACTION}}
                  <p style="margin:15px 0 0;font-size:9px;color:#92958f">{{NOTICE}}</p>
                </td></tr>
              </table>
            </td></tr>
            """
            .replace("{{TITLE}}", escape(title))
            .replace("{{GREETING}}", greeting)
            .replace("{{MESSAGE}}", escape(message))
            .replace("{{ACTION}}", actionButton(action, url))
            .replace("{{NOTICE}}", escape(notice));
        return emailShell(title, body);
    }

    private String actionButton(String label, String url) {
        return """
            <p style="margin:25px 0 0;text-align:center">
              <a href="{{URL}}" style="display:inline-block;min-width:180px;padding:13px 22px;
                border-radius:8px;background:#d48b22;color:#ffffff;text-decoration:none;
                font-size:12px;font-weight:700;text-align:center">{{LABEL}}</a>
            </p>
            """
            .replace("{{URL}}", escape(url))
            .replace("{{LABEL}}", escape(label));
    }

    private String emailShell(String preheader, String body) {
        return """
            <!doctype html>
            <html lang="en"><head><meta charset="UTF-8"><meta name="viewport"
              content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;background:#f7f5f1;font-family:Arial,Helvetica,sans-serif;color:#191816">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0">{{PREHEADER}}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding:28px 14px">
                  <table role="presentation" width="628" cellpadding="0" cellspacing="0"
                    style="width:100%;max-width:628px;border:1px solid #ece7df;border-radius:16px;
                    background:#ffffff;box-shadow:0 12px 32px rgba(47,39,28,.06)">
                    <tr><td align="center" style="padding:27px 30px 23px">
                      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:9px"><img src="{{LOGO_URL}}" width="27" height="27"
                          alt="" style="display:block;width:27px;height:27px;border:0"></td>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;
                          font-weight:700;letter-spacing:.02em;color:#191816">KOINO</td>
                      </tr></table>
                    </td></tr>
                    {{BODY}}
                    <tr><td style="padding:23px 34px;border-top:1px solid #eee8df">
                      <table role="presentation" width="100%"><tr>
                        <td style="font-size:10px;line-height:1.6;color:#8c8f89">
                          <strong style="color:#353733">Koino</strong><br>
                          Grow daily in faith, purpose, and wisdom.
                        </td>
                        <td align="right" style="font-size:9px;color:#a0a29d">Koino account email</td>
                      </tr></table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """
            .replace("{{PREHEADER}}", escape(preheader))
            .replace("{{LOGO_URL}}", escape(appUrl + "koino-logo.svg"))
            .replace("{{BODY}}", body);
    }

    private String displayName(String name) {
        return name == null || name.isBlank() ? "there" : name.trim();
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
