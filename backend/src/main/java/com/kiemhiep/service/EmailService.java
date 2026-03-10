package com.kiemhiep.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from:onboarding@resend.dev}")
    private String fromEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendNotificationEmail(String toEmail, String title, String message, String link) {
        if (apiKey == null || apiKey.isBlank()) return;
        try {
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
                    link != null
                        ? "<a href=\"" + link + "\" style=\"display:inline-block;padding:10px 20px;background:#c8960c;color:#000;text-decoration:none;border-radius:4px;margin-top:12px;\">Xem ngay →</a>"
                        : ""
            );

            Map<String, Object> body = Map.of(
                "from", fromEmail,
                "to", List.of(toEmail),
                "subject", "[Kiếm Hiệp Vô Song] " + title,
                "html", html
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            restTemplate.exchange(
                "https://api.resend.com/emails",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
            );
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
