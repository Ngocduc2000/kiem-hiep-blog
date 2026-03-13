package com.kiemhiep.controller;

import com.kiemhiep.dto.ChapterRequest;
import com.kiemhiep.dto.StoryRequest;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.StoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    private UserDetailsImpl principal(Authentication auth) {
        return auth != null ? (UserDetailsImpl) auth.getPrincipal() : null;
    }

    // ---- public ----

    @GetMapping
    public ResponseEntity<?> getStories(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "12") int size,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(required = false) String status) {
        return ResponseEntity.ok(storyService.getStories(page, size, q, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStory(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(storyService.getStory(id, principal(auth)));
    }

    @GetMapping("/{id}/chapters")
    public ResponseEntity<?> getChapters(@PathVariable String id,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "50") int size,
                                         @RequestParam(required = false) String q,
                                         Authentication auth) {
        return ResponseEntity.ok(storyService.getChapters(id, page, size, q, principal(auth)));
    }

    @GetMapping("/{id}/chapters/all")
    public ResponseEntity<?> getAllChaptersMeta(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(storyService.getAllChaptersMeta(id, principal(auth)));
    }

    @GetMapping("/{id}/chapters/{chapterNumber}/read")
    public ResponseEntity<?> readChapter(@PathVariable String id,
                                         @PathVariable int chapterNumber,
                                         Authentication auth) {
        return ResponseEntity.ok(storyService.readChapter(id, chapterNumber, principal(auth)));
    }

    @GetMapping("/{id}/chapters/{chapterId}/edit")
    public ResponseEntity<?> getChapterForEdit(@PathVariable String id,
                                               @PathVariable String chapterId,
                                               Authentication auth) {
        return ResponseEntity.ok(storyService.getChapterForEdit(id, chapterId, principal(auth)));
    }

    // ---- user story management ----

    @GetMapping("/my")
    public ResponseEntity<?> getMyStories(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.getMyStories(principal(auth).getId()));
    }

    @PostMapping
    public ResponseEntity<?> createStory(@RequestBody StoryRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.createStory(req, principal(auth)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStory(@PathVariable String id,
                                         @RequestBody StoryRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.updateStory(id, req, principal(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStory(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        storyService.deleteStory(id, principal(auth));
        return ResponseEntity.ok().build();
    }

    // ---- admin approval ----

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> getPendingStories(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(storyService.getPendingStories(page, size));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> approveStory(@PathVariable String id) {
        return ResponseEntity.ok(storyService.approveStory(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> rejectStory(@PathVariable String id) {
        return ResponseEntity.ok(storyService.rejectStory(id));
    }

    // ---- chapters ----

    @PostMapping("/{id}/chapters")
    public ResponseEntity<?> addChapter(@PathVariable String id,
                                        @RequestBody ChapterRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.addChapter(id, req, principal(auth)));
    }

    @PutMapping("/{id}/chapters/{chapterId}")
    public ResponseEntity<?> updateChapter(@PathVariable String id, @PathVariable String chapterId,
                                           @RequestBody ChapterRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.updateChapter(id, chapterId, req, principal(auth)));
    }

    @DeleteMapping("/{id}/chapters/{chapterId}")
    public ResponseEntity<?> deleteChapter(@PathVariable String id, @PathVariable String chapterId,
                                           Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        storyService.deleteChapter(id, chapterId, principal(auth));
        return ResponseEntity.ok().build();
    }

    // ---- rating ----

    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateStory(@PathVariable String id,
                                       @RequestBody Map<String, Integer> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.rateStory(id, body.getOrDefault("rating", 0), principal(auth).getId()));
    }

    @GetMapping("/{id}/my-rating")
    public ResponseEntity<?> getMyRating(@PathVariable String id, Authentication auth) {
        String userId = auth != null ? principal(auth).getId() : null;
        return ResponseEntity.ok(storyService.getMyRating(id, userId));
    }

    // ---- follow ----

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> toggleFollow(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.toggleFollow(id, principal(auth)));
    }

    @GetMapping("/{id}/follow/status")
    public ResponseEntity<?> getFollowStatus(@PathVariable String id, Authentication auth) {
        String userId = auth != null ? principal(auth).getId() : null;
        return ResponseEntity.ok(storyService.getFollowStatus(id, userId));
    }

    // ---- comments ----

    @GetMapping("/{id}/chapters/{chapterNumber}/comments")
    public ResponseEntity<?> getComments(@PathVariable String id, @PathVariable int chapterNumber,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(storyService.getComments(id, chapterNumber, page, size));
    }

    @PostMapping("/{id}/chapters/{chapterNumber}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @PathVariable int chapterNumber,
                                        @RequestBody CommentRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(storyService.addComment(id, chapterNumber, req.getContent(), principal(auth)));
    }

    @Data
    static class CommentRequest {
        private String content;
    }
}
