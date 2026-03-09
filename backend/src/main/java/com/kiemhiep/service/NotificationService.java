package com.kiemhiep.service;

import com.kiemhiep.model.Notification;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.NotificationRepository;
import com.kiemhiep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    public void send(String userId, String type, String title, String message, String link) {
        // Save to DB
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setType(type);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setLink(link);
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);

        // Push via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notif);
        } catch (Exception e) {
            log.warn("WS push failed for user {}: {}", userId, e.getMessage());
        }

        // Send email async
        userRepository.findById(userId).map(User::getEmail).ifPresent(email -> {
            if (email != null && !email.isBlank()) {
                emailService.sendNotificationEmail(email, title, message, link);
            }
        });
    }
}
