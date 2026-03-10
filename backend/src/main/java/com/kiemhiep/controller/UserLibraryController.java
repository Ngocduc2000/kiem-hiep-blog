package com.kiemhiep.controller;

import com.kiemhiep.model.Bookmark;
import com.kiemhiep.model.ReadingHistory;
import com.kiemhiep.repository.BookmarkRepository;
import com.kiemhiep.repository.ReadingHistoryRepository;
import com.kiemhiep.repository.StoryFollowRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class UserLibraryController {
    private final BookmarkRepository bookmarkRepository;
    private final ReadingHistoryRepository historyRepository;
    private final StoryFollowRepository storyFollowRepository;

    // ---- FOLLOWING ----

    @GetMapping("/following")
    public ResponseEntity<?> getFollowing(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(storyFollowRepository.findByUserIdOrderByFollowedAtDesc(user.getId()));
    }

    // ---- BOOKMARKS ----

    @GetMapping("/bookmarks")
    public ResponseEntity<?> getBookmarks(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(bookmarkRepository.findByUserIdOrderBySavedAtDesc(user.getId()));
    }

    @PostMapping("/bookmarks")
    public ResponseEntity<?> toggleBookmark(@RequestBody BookmarkRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        var existing = bookmarkRepository.findByUserIdAndStoryId(user.getId(), req.getStoryId());
        if (existing.isPresent()) {
            // Update chapter position
            Bookmark bm = existing.get();
            bm.setChapterNumber(req.getChapterNumber());
            bm.setChapterTitle(req.getChapterTitle());
            bm.setSavedAt(LocalDateTime.now());
            return ResponseEntity.ok(Map.of("action", "updated", "bookmark", bookmarkRepository.save(bm)));
        }
        Bookmark bm = new Bookmark();
        bm.setUserId(user.getId());
        bm.setStoryId(req.getStoryId());
        bm.setStoryTitle(req.getStoryTitle());
        bm.setCoverImage(req.getCoverImage());
        bm.setAuthor(req.getAuthor());
        bm.setChapterNumber(req.getChapterNumber());
        bm.setChapterTitle(req.getChapterTitle());
        bm.setSavedAt(LocalDateTime.now());
        return ResponseEntity.ok(Map.of("action", "added", "bookmark", bookmarkRepository.save(bm)));
    }

    @DeleteMapping("/bookmarks/{storyId}")
    public ResponseEntity<?> removeBookmark(@PathVariable String storyId, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        bookmarkRepository.deleteByUserIdAndStoryId(user.getId(), storyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/bookmarks/{storyId}/exists")
    public ResponseEntity<?> checkBookmark(@PathVariable String storyId, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        boolean exists = bookmarkRepository.existsByUserIdAndStoryId(user.getId(), storyId);
        return ResponseEntity.ok(Map.of("bookmarked", exists));
    }

    // ---- READING HISTORY ----

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(
            historyRepository.findByUserIdOrderByReadAtDesc(user.getId(), PageRequest.of(page, size))
        );
    }

    @PostMapping("/history")
    public ResponseEntity<?> recordHistory(@RequestBody HistoryRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        // Upsert: update if same story+chapter exists
        var existing = historyRepository.findByUserIdAndStoryIdAndChapterNumber(
            user.getId(), req.getStoryId(), req.getChapterNumber());
        ReadingHistory h = existing.orElse(new ReadingHistory());
        h.setUserId(user.getId());
        h.setStoryId(req.getStoryId());
        h.setStoryTitle(req.getStoryTitle());
        h.setCoverImage(req.getCoverImage());
        h.setAuthor(req.getAuthor());
        h.setChapterNumber(req.getChapterNumber());
        h.setChapterTitle(req.getChapterTitle());
        h.setReadAt(LocalDateTime.now());
        historyRepository.save(h);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory(Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        historyRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok().build();
    }

    @Data
    static class BookmarkRequest {
        private String storyId;
        private String storyTitle;
        private String coverImage;
        private String author;
        private int chapterNumber;
        private String chapterTitle;
    }

    @Data
    static class HistoryRequest {
        private String storyId;
        private String storyTitle;
        private String coverImage;
        private String author;
        private int chapterNumber;
        private String chapterTitle;
    }
}
