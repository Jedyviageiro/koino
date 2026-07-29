package com.koino.backend.service.GmailService;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.koino.backend.model.User;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(
        JavaMailSender mailSender,
        @Value("${app.mail.from}") String from
    ) {
        this.mailSender = mailSender;
        this.from = from;
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

    private void sendHtml(String to, String subject, String html) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            message.setFrom(from);
            message.setRecipients(
                jakarta.mail.Message.RecipientType.TO,
                to
            );
            message.setSubject(subject, StandardCharsets.UTF_8.name());
            message.setContent(html, "text/html; charset=UTF-8");
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Unable to prepare email", exception);
        }
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
