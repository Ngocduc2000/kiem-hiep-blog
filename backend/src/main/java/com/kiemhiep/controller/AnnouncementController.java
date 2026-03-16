package com.kiemhiep.controller;

import com.kiemhiep.dto.AnnouncementRequest;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<?> getPinned() {
        log.info("[GET /api/announcements]");
        return ResponseEntity.ok(announcementService.getPinned());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> getAll() {
        log.info("[GET /api/announcements/all]");
        return ResponseEntity.ok(announcementService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> create(@RequestBody AnnouncementRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        log.info("[POST /api/announcements] userId={}", user.getId());
        return ResponseEntity.ok(announcementService.create(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody AnnouncementRequest req) {
        log.info("[PUT /api/announcements/{}]", id);
        return ResponseEntity.ok(announcementService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> delete(@PathVariable String id) {
        log.info("[DELETE /api/announcements/{}]", id);
        announcementService.delete(id);
        return ResponseEntity.ok().build();
    }
}
