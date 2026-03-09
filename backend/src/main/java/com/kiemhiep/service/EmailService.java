package com.kiemhiep.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Async
    public void sendNotificationEmail(String toEmail, String title, String message, String link) {
        if (fromEmail == null || fromEmail.isBlank()) return;
        try {
            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[Kiếm Hiệp Vô Song] " + title);
            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #1a1a1f; padding: 20px; text-align: center;">
                    <h2 style="color: #c8960c; margin: 0;">⚔ Kiếm Hiệp Vô Song</h2>
                  </div>
                  <div style="padding: 24px; background: #f9f9f9;">
                    <h3 style="color: #333;">%s</h3>
                    <p style="color: #555; line-height: 1.6;">%s</p>
                    %s
                  </div>
                  <div style="padding: 12px; background: #eee; text-align: center; font-size: 12px; color: #999;">
                    Kiếm Hiệp Vô Song — Diễn đàn kiếm hiệp
                  </div>
                </div>
                """.formatted(
                    title, message,
                    link != null ? "<a href=\"" + link + "\" style=\"display:inline-block;padding:10px 20px;background:#c8960c;color:#000;text-decoration:none;border-radius:4px;margin-top:12px;\">Xem ngay →</a>" : ""
            );
            helper.setText(html, true);
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
