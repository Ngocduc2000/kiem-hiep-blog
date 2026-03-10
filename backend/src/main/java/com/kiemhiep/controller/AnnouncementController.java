package com.kiemhiep.controller;

import com.kiemhiep.model.Announcement;
import com.kiemhiep.repository.AnnouncementRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementRepository announcementRepository;

    /** Public: get pinned announcements for homepage */
    @GetMapping
    public ResponseEntity<List<Announcement>> getPinned() {
        return ResponseEntity.ok(announcementRepository.findByPinnedTrueOrderByCreatedAtDesc());
    }

    /** Admin: get all announcements */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<List<Announcement>> getAll() {
        return ResponseEntity.ok(announcementRepository.findAllByOrderByCreatedAtDesc());
    }

    /** Admin: create announcement */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> create(@RequestBody AnnouncementRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        Announcement ann = new Announcement();
        ann.setTitle(req.getTitle());
        ann.setContent(req.getContent());
        ann.setType(req.getType() != null ? req.getType() : "INFO");
        ann.setPinned(req.isPinned());
        ann.setCreatedBy(user.getUsername());
        ann.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(announcementRepository.save(ann));
    }

    /** Admin: update announcement */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody AnnouncementRequest req) {
        return announcementRepository.findById(id).map(ann -> {
            ann.setTitle(req.getTitle());
            ann.setContent(req.getContent());
            if (req.getType() != null) ann.setType(req.getType());
            ann.setPinned(req.isPinned());
            ann.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(announcementRepository.save(ann));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Admin: delete announcement */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> delete(@PathVariable String id) {
        announcementRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @Data
    static class AnnouncementRequest {
        private String title;
        private String content;
        private String type;
        private boolean pinned = true;
    }
}
