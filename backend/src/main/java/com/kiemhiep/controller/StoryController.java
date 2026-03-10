package com.kiemhiep.controller;

import com.kiemhiep.model.Chapter;
import com.kiemhiep.model.ChapterComment;
import com.kiemhiep.model.Story;
import com.kiemhiep.model.StoryRating;
import com.kiemhiep.repository.ChapterCommentRepository;
import com.kiemhiep.repository.ChapterRepository;
import com.kiemhiep.repository.StoryRatingRepository;
import com.kiemhiep.repository.StoryRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterCommentRepository commentRepository;
    private final StoryRatingRepository storyRatingRepository;
    private final UserRepository userRepository;

    // ---- PUBLIC ----

    @GetMapping
    public ResponseEntity<?> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Story.StoryStatus storyStatus = null;
        if (status != null && !status.isBlank()) {
            try { storyStatus = Story.StoryStatus.valueOf(status); } catch (Exception ignored) {}
        }
        if (q != null && !q.isBlank()) {
            if (storyStatus != null) {
                return ResponseEntity.ok(storyRepository.findByTitleContainingIgnoreCaseAndStatus(q, storyStatus, pageable));
            }
            return ResponseEntity.ok(storyRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(q, q, pageable));
        }
        if (storyStatus != null) {
            return ResponseEntity.ok(storyRepository.findByStatusOrderByCreatedAtDesc(storyStatus, pageable));
        }
        return ResponseEntity.ok(storyRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    /** Story info only — fast, no chapters */
    @GetMapping("/{id}")
    public ResponseEntity<?> getStory(@PathVariable String id) {
        return storyRepository.findById(id)
                .map(story -> {
                    story.setViewCount(story.getViewCount() + 1);
                    storyRepository.save(story);
                    return ResponseEntity.ok(story);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Paginated + searchable chapter list (no content field) */
    @GetMapping("/{id}/chapters")
    public ResponseEntity<?> getChapters(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String q) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("chapterNumber").ascending());
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(chapterRepository.searchInStory(id, q, pageable));
        }
        return ResponseEntity.ok(chapterRepository.findByStoryIdNoContent(id, pageable));
    }

    /** All chapters metadata — for dropdown/index */
    @GetMapping("/{id}/chapters/all")
    public ResponseEntity<?> getAllChaptersMeta(@PathVariable String id) {
        return ResponseEntity.ok(
            chapterRepository.findByStoryIdNoContent(id, Sort.by("chapterNumber").ascending())
        );
    }

    /** Read a chapter — includes content + story title + prev/next */
    @GetMapping("/{id}/chapters/{chapterNumber}/read")
    public ResponseEntity<?> readChapter(@PathVariable String id, @PathVariable int chapterNumber) {
        return chapterRepository.findByStoryIdAndChapterNumber(id, chapterNumber)
                .map(chapter -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("chapter", chapter);
                    result.put("hasPrev", chapterNumber > 1);
                    result.put("hasNext", chapterRepository
                            .findByStoryIdAndChapterNumber(id, chapterNumber + 1).isPresent());
                    storyRepository.findById(id).ifPresent(s ->
                            result.put("storyTitle", s.getTitle()));
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Admin: get single chapter with full content for editing */
    @GetMapping("/{id}/chapters/{chapterId}/edit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getChapterForEdit(@PathVariable String id,
                                                @PathVariable String chapterId) {
        return chapterRepository.findById(chapterId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- RATING ----

    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateStory(@PathVariable String id, @RequestBody Map<String, Integer> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        int rating = body.getOrDefault("rating", 0);
        if (rating < 1 || rating > 5) return ResponseEntity.badRequest().body("Rating must be 1-5");

        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();

        StoryRating existing = storyRatingRepository.findByStoryIdAndUserId(id, userDetails.getId()).orElse(null);
        if (existing != null) {
            existing.setRating(rating);
            existing.setUpdatedAt(LocalDateTime.now());
            storyRatingRepository.save(existing);
        } else {
            StoryRating newRating = new StoryRating();
            newRating.setStoryId(id);
            newRating.setUserId(userDetails.getId());
            newRating.setRating(rating);
            newRating.setCreatedAt(LocalDateTime.now());
            storyRatingRepository.save(newRating);
        }

        List<StoryRating> allRatings = storyRatingRepository.findByStoryId(id);
        double avg = allRatings.stream().mapToInt(StoryRating::getRating).average().orElse(0);
        story.setAverageRating(Math.round(avg * 10.0) / 10.0);
        story.setRatingCount(allRatings.size());
        storyRepository.save(story);

        return ResponseEntity.ok(Map.of("averageRating", story.getAverageRating(), "ratingCount", story.getRatingCount(), "userRating", rating));
    }

    @GetMapping("/{id}/my-rating")
    public ResponseEntity<?> getMyRating(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.ok(Map.of("rating", 0));
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        StoryRating r = storyRatingRepository.findByStoryIdAndUserId(id, userDetails.getId()).orElse(null);
        return ResponseEntity.ok(Map.of("rating", r != null ? r.getRating() : 0));
    }

    // ---- ADMIN ----

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStory(@RequestBody StoryRequest req, Authentication auth) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        Story story = new Story();
        story.setTitle(req.getTitle());
        story.setAuthor(req.getAuthor());
        story.setDescription(req.getDescription());
        story.setCoverImage(req.getCoverImage());
        story.setGenres(req.getGenres());
        story.setStatus(req.getStatus() != null ? req.getStatus() : Story.StoryStatus.ONGOING);
        story.setUploadedBy(user.getId());
        story.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(storyRepository.save(story));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStory(@PathVariable String id, @RequestBody StoryRequest req) {
        return storyRepository.findById(id).map(story -> {
            story.setTitle(req.getTitle());
            story.setAuthor(req.getAuthor());
            story.setDescription(req.getDescription());
            if (req.getCoverImage() != null) story.setCoverImage(req.getCoverImage());
            story.setGenres(req.getGenres());
            if (req.getStatus() != null) story.setStatus(req.getStatus());
            story.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(storyRepository.save(story));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteStory(@PathVariable String id) {
        chapterRepository.deleteByStoryId(id);
        storyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/chapters")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addChapter(@PathVariable String id, @RequestBody ChapterRequest req) {
        long count = chapterRepository.countByStoryId(id);
        Chapter chapter = new Chapter();
        chapter.setStoryId(id);
        chapter.setChapterNumber(req.getChapterNumber() != null ? req.getChapterNumber() : (int) count + 1);
        chapter.setTitle(req.getTitle());
        chapter.setContent(req.getContent());
        chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
        chapter.setCreatedAt(LocalDateTime.now());
        Chapter saved = chapterRepository.save(chapter);

        storyRepository.findById(id).ifPresent(story -> {
            story.setTotalChapters((int) chapterRepository.countByStoryId(id));
            story.setUpdatedAt(LocalDateTime.now());
            storyRepository.save(story);
        });
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/chapters/{chapterId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateChapter(@PathVariable String id, @PathVariable String chapterId,
                                            @RequestBody ChapterRequest req) {
        return chapterRepository.findById(chapterId).map(chapter -> {
            chapter.setTitle(req.getTitle());
            chapter.setContent(req.getContent());
            chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
            chapter.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(chapterRepository.save(chapter));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/chapters/{chapterId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteChapter(@PathVariable String id, @PathVariable String chapterId) {
        chapterRepository.deleteById(chapterId);
        storyRepository.findById(id).ifPresent(story -> {
            story.setTotalChapters((int) chapterRepository.countByStoryId(id));
            storyRepository.save(story);
        });
        return ResponseEntity.ok().build();
    }

    // ---- COMMENTS ----

    @GetMapping("/{id}/chapters/{chapterNumber}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable String id,
            @PathVariable int chapterNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<ChapterComment> comments = commentRepository
                .findByStoryIdAndChapterNumberOrderByCreatedAtDesc(id, chapterNumber, pageable);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{id}/chapters/{chapterNumber}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable String id,
            @PathVariable int chapterNumber,
            @RequestBody CommentRequest req,
            Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().build();
        ChapterComment comment = new ChapterComment();
        comment.setStoryId(id);
        comment.setChapterNumber(chapterNumber);
        comment.setUserId(user.getId());
        comment.setUsername(user.getUsername());
        comment.setDisplayName(user.getDisplayName());
        comment.setContent(req.getContent().trim());
        comment.setCreatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(commentRepository.save(comment));
    }

    @Data
    static class StoryRequest {
        private String title;
        private String author;
        private String description;
        private String coverImage;
        private java.util.List<String> genres;
        private Story.StoryStatus status;
    }

    @Data
    static class ChapterRequest {
        private Integer chapterNumber;
        private String title;
        private String content;
    }

    @Data
    static class CommentRequest {
        private String content;
    }
}
