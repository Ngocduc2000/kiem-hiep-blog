package com.kiemhiep.controller;

import com.kiemhiep.model.Chapter;
import com.kiemhiep.model.ChapterComment;
import com.kiemhiep.model.Story;
import com.kiemhiep.model.StoryFollow;
import com.kiemhiep.model.StoryRating;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.ChapterCommentRepository;
import com.kiemhiep.repository.ChapterRepository;
import com.kiemhiep.repository.StoryFollowRepository;
import com.kiemhiep.repository.StoryRatingRepository;
import com.kiemhiep.repository.StoryRepository;
import com.kiemhiep.repository.UserRepository;
import com.kiemhiep.security.UserDetailsImpl;
import com.kiemhiep.service.NotificationService;
import com.kiemhiep.util.UserLevel;
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
    private final StoryFollowRepository storyFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ---- HELPERS ----

    private boolean isAdminOrMod(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MOD"));
    }

    private boolean canManageStory(Story story, Authentication auth) {
        if (auth == null) return false;
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        boolean isOwner = user.getId().equals(story.getUploadedBy());
        return isOwner || isAdminOrMod(auth);
    }

    private boolean isApproved(Story story) {
        String s = story.getApprovalStatus();
        return s == null || "APPROVED".equals(s);
    }

    // ---- PUBLIC ----

    @GetMapping
    public ResponseEntity<?> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (q != null && !q.isBlank()) {
            if (status != null && !status.isBlank()) {
                return ResponseEntity.ok(storyRepository.findApprovedByTitleAndStatus(q, status, pageable));
            }
            return ResponseEntity.ok(storyRepository.findApprovedByQuery(q, pageable));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(storyRepository.findApprovedByStatus(status, pageable));
        }
        return ResponseEntity.ok(storyRepository.findAllApproved(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStory(@PathVariable String id, Authentication auth) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!isApproved(story) && !canManageStory(story, auth)) {
            return ResponseEntity.status(403).build();
        }
        story.setViewCount(story.getViewCount() + 1);
        storyRepository.save(story);
        return ResponseEntity.ok(story);
    }

    @GetMapping("/{id}/chapters")
    public ResponseEntity<?> getChapters(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String q,
            Authentication auth) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!isApproved(story) && !canManageStory(story, auth)) {
            return ResponseEntity.status(403).build();
        }
        PageRequest pageable = PageRequest.of(page, size, Sort.by("chapterNumber").ascending());
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(chapterRepository.searchInStory(id, q, pageable));
        }
        return ResponseEntity.ok(chapterRepository.findByStoryIdNoContent(id, pageable));
    }

    @GetMapping("/{id}/chapters/all")
    public ResponseEntity<?> getAllChaptersMeta(@PathVariable String id, Authentication auth) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!isApproved(story) && !canManageStory(story, auth)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(
            chapterRepository.findByStoryIdNoContent(id, Sort.by("chapterNumber").ascending())
        );
    }

    @GetMapping("/{id}/chapters/{chapterNumber}/read")
    public ResponseEntity<?> readChapter(@PathVariable String id, @PathVariable int chapterNumber, Authentication auth) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!isApproved(story) && !canManageStory(story, auth)) {
            return ResponseEntity.status(403).build();
        }
        return chapterRepository.findByStoryIdAndChapterNumber(id, chapterNumber)
                .map(chapter -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("chapter", chapter);
                    result.put("hasPrev", chapterNumber > 1);
                    result.put("hasNext", chapterRepository
                            .findByStoryIdAndChapterNumber(id, chapterNumber + 1).isPresent());
                    result.put("storyTitle", story.getTitle());
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/chapters/{chapterId}/edit")
    public ResponseEntity<?> getChapterForEdit(@PathVariable String id,
                                                @PathVariable String chapterId,
                                                Authentication auth) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();
        return chapterRepository.findById(chapterId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- USER: truyện của mình ----

    @GetMapping("/my")
    public ResponseEntity<?> getMyStories(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(storyRepository.findByUploadedByOrderByCreatedAtDesc(user.getId()));
    }

    // ---- CRUD STORY (user + admin) ----

    @PostMapping
    public ResponseEntity<?> createStory(@RequestBody StoryRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

        // Kiểm tra tài khoản đã được duyệt (trừ admin/mod)
        if (!isAdminOrMod(auth)) {
            User dbUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (dbUser == null || dbUser.getMemberStatus() != User.MemberStatus.APPROVED) {
                return ResponseEntity.status(403).body("Tài khoản chưa được duyệt để đăng truyện");
            }
        }

        Story story = new Story();
        story.setTitle(req.getTitle());
        story.setAuthor(req.getAuthor());
        story.setDescription(req.getDescription());
        story.setCoverImage(req.getCoverImage());
        story.setGenres(req.getGenres());
        story.setStatus(req.getStatus() != null ? req.getStatus() : Story.StoryStatus.ONGOING);
        story.setUploadedBy(userDetails.getId());
        story.setCreatedAt(LocalDateTime.now());
        // Admin/Mod → tự động duyệt; user thường → chờ duyệt
        story.setApprovalStatus(isAdminOrMod(auth) ? "APPROVED" : "PENDING");
        return ResponseEntity.ok(storyRepository.save(story));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStory(@PathVariable String id, @RequestBody StoryRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();
        story.setTitle(req.getTitle());
        story.setAuthor(req.getAuthor());
        story.setDescription(req.getDescription());
        if (req.getCoverImage() != null) story.setCoverImage(req.getCoverImage());
        story.setGenres(req.getGenres());
        if (req.getStatus() != null) story.setStatus(req.getStatus());
        story.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(storyRepository.save(story));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStory(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();
        chapterRepository.deleteByStoryId(id);
        storyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ---- ADMIN: duyệt/từ chối truyện ----

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> getPendingStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(storyRepository.findByApprovalStatusOrderByCreatedAtDesc("PENDING", pageable));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> approveStory(@PathVariable String id) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        story.setApprovalStatus("APPROVED");
        story.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(storyRepository.save(story));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MOD')")
    public ResponseEntity<?> rejectStory(@PathVariable String id) {
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        story.setApprovalStatus("REJECTED");
        story.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(storyRepository.save(story));
    }

    // ---- CHAPTERS ----

    @PostMapping("/{id}/chapters")
    public ResponseEntity<?> addChapter(@PathVariable String id, @RequestBody ChapterRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();

        long count = chapterRepository.countByStoryId(id);
        Chapter chapter = new Chapter();
        chapter.setStoryId(id);
        chapter.setChapterNumber(req.getChapterNumber() != null ? req.getChapterNumber() : (int) count + 1);
        chapter.setTitle(req.getTitle());
        chapter.setContent(req.getContent());
        chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
        chapter.setCreatedAt(LocalDateTime.now());
        Chapter saved = chapterRepository.save(chapter);

        story.setTotalChapters((int) chapterRepository.countByStoryId(id));
        story.setUpdatedAt(LocalDateTime.now());
        storyRepository.save(story);

        // Thông báo cho follower (chỉ khi truyện đã được duyệt)
        if (isApproved(story)) {
            String notifBody = "Chương " + saved.getChapterNumber() + ": " + saved.getTitle();
            storyFollowRepository.findByStoryId(id).forEach(follow ->
                notificationService.send(
                    follow.getUserId(),
                    "NEW_CHAPTER",
                    "📖 " + story.getTitle() + " có chương mới!",
                    notifBody,
                    "/stories/" + id + "/chapters/" + saved.getChapterNumber()
                )
            );
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/chapters/{chapterId}")
    public ResponseEntity<?> updateChapter(@PathVariable String id, @PathVariable String chapterId,
                                            @RequestBody ChapterRequest req, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();
        return chapterRepository.findById(chapterId).map(chapter -> {
            chapter.setTitle(req.getTitle());
            chapter.setContent(req.getContent());
            chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
            chapter.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(chapterRepository.save(chapter));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/chapters/{chapterId}")
    public ResponseEntity<?> deleteChapter(@PathVariable String id, @PathVariable String chapterId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        if (!canManageStory(story, auth)) return ResponseEntity.status(403).build();
        chapterRepository.deleteById(chapterId);
        story.setTotalChapters((int) chapterRepository.countByStoryId(id));
        storyRepository.save(story);
        return ResponseEntity.ok().build();
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

    // ---- FOLLOW ----

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> toggleFollow(@PathVariable String id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        Story story = storyRepository.findById(id).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();

        boolean wasFollowing = storyFollowRepository.existsByStoryIdAndUserId(id, userDetails.getId());
        if (wasFollowing) {
            storyFollowRepository.deleteByStoryIdAndUserId(id, userDetails.getId());
        } else {
            StoryFollow follow = new StoryFollow();
            follow.setStoryId(id);
            follow.setStoryTitle(story.getTitle());
            follow.setCoverImage(story.getCoverImage());
            follow.setAuthor(story.getAuthor());
            follow.setUserId(userDetails.getId());
            follow.setFollowedAt(LocalDateTime.now());
            storyFollowRepository.save(follow);
        }
        long count = storyFollowRepository.countByStoryId(id);
        return ResponseEntity.ok(Map.of("following", !wasFollowing, "followerCount", count));
    }

    @GetMapping("/{id}/follow/status")
    public ResponseEntity<?> getFollowStatus(@PathVariable String id, Authentication auth) {
        boolean following = false;
        if (auth != null) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            following = storyFollowRepository.existsByStoryIdAndUserId(id, userDetails.getId());
        }
        long count = storyFollowRepository.countByStoryId(id);
        return ResponseEntity.ok(Map.of("following", following, "followerCount", count));
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

        userRepository.findByUsername(user.getUsername()).ifPresent(u -> {
            u.setExp(u.getExp() + 5);
            userRepository.save(u);
            comment.setExp(u.getExp());
            comment.setLevel(com.kiemhiep.util.UserLevel.getLevelName(u.getExp()));
        });

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
