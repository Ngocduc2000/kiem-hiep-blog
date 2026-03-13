package com.kiemhiep.controller;

import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
        return ResponseEntity.ok(notificationService.getNotifications(user.getId(), page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(user.getId())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
