package com.kiemhiep.controller;

import com.kiemhiep.dto.BookmarkRequest;
import com.kiemhiep.dto.HistoryRequest;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.UserLibraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class UserLibraryController {

    private final UserLibraryService userLibraryService;

    @GetMapping("/following")
    public ResponseEntity<?> getFollowing(Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[GET /api/library/following] userId={}", userId);
        return ResponseEntity.ok(userLibraryService.getFollowing(userId));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<?> getBookmarks(Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[GET /api/library/bookmarks] userId={}", userId);
        return ResponseEntity.ok(userLibraryService.getBookmarks(userId));
    }

    @PostMapping("/bookmarks")
    public ResponseEntity<?> toggleBookmark(@RequestBody BookmarkRequest req, Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[POST /api/library/bookmarks] userId={}", userId);
        return ResponseEntity.ok(userLibraryService.toggleBookmark(req, userId));
    }

    @DeleteMapping("/bookmarks/{storyId}")
    public ResponseEntity<?> removeBookmark(@PathVariable String storyId, Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[DELETE /api/library/bookmarks/{}] userId={}", storyId, userId);
        userLibraryService.removeBookmark(storyId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/bookmarks/{storyId}/exists")
    public ResponseEntity<?> checkBookmark(@PathVariable String storyId, Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[GET /api/library/bookmarks/{}/exists] userId={}", storyId, userId);
        return ResponseEntity.ok(userLibraryService.checkBookmark(storyId, userId));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size,
                                        Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[GET /api/library/history] userId={} page={} size={}", userId, page, size);
        return ResponseEntity.ok(userLibraryService.getHistory(userId, page, size));
    }

    @PostMapping("/history")
    public ResponseEntity<?> recordHistory(@RequestBody HistoryRequest req, Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[POST /api/library/history] userId={}", userId);
        userLibraryService.recordHistory(req, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory(Authentication auth) {
        String userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        log.info("[DELETE /api/library/history] userId={}", userId);
        userLibraryService.clearHistory(userId);
        return ResponseEntity.ok().build();
    }
}
