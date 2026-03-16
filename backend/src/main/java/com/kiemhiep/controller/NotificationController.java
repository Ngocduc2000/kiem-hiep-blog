package com.kiemhiep.controller;

import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[GET /api/notifications] userId={} page={} size={}", user.getId(), page, size);
        return ResponseEntity.ok(notificationService.getNotifications(user.getId(), page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[GET /api/notifications/unread-count] userId={}", user.getId());
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(user.getId())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        log.info("[POST /api/notifications/{}/read]", id);
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[POST /api/notifications/read-all] userId={}", user.getId());
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
