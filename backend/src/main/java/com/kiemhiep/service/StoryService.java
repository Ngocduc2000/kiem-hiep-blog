package com.kiemhiep.service;

import com.kiemhiep.dto.ChapterRequest;
import com.kiemhiep.dto.StoryRequest;
import com.kiemhiep.model.*;
import com.kiemhiep.repository.*;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterCommentRepository commentRepository;
    private final StoryRatingRepository storyRatingRepository;
    private final StoryFollowRepository storyFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ---- helpers ----

    private boolean isAdminOrMod(UserDetailsImpl user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MOD"));
    }

    private boolean canManageStory(Story story, UserDetailsImpl user) {
        return user.getId().equals(story.getUploadedBy()) || isAdminOrMod(user);
    }

    private boolean isApproved(Story story) {
        String s = story.getApprovalStatus();
        return s == null || "APPROVED".equals(s);
    }

    private Story requireVisible(String id, UserDetailsImpl user) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!isApproved(story) && (user == null || !canManageStory(story, user))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return story;
    }

    private void requireManage(Story story, UserDetailsImpl user) {
        if (user == null || !canManageStory(story, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    // ---- public queries ----

    public Page<Story> getStories(int page, int size, String q, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (q != null && !q.isBlank()) {
            if (status != null && !status.isBlank()) {
                return storyRepository.findApprovedByTitleAndStatus(q, status, pageable);
            }
            return storyRepository.findApprovedByQuery(q, pageable);
        }
        if (status != null && !status.isBlank()) {
            return storyRepository.findApprovedByStatus(status, pageable);
        }
        return storyRepository.findAllApproved(pageable);
    }

    public Story getStory(String id, UserDetailsImpl user) {
        Story story = requireVisible(id, user);
        story.setViewCount(story.getViewCount() + 1);
        return storyRepository.save(story);
    }

    public Page<?> getChapters(String storyId, int page, int size, String q, UserDetailsImpl user) {
        Story story = requireVisible(storyId, user);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("chapterNumber").ascending());
        if (q != null && !q.isBlank()) {
            return chapterRepository.searchInStory(storyId, q, pageable);
        }
        return chapterRepository.findByStoryIdNoContent(storyId, pageable);
    }

    public List<?> getAllChaptersMeta(String storyId, UserDetailsImpl user) {
        requireVisible(storyId, user);
        return chapterRepository.findByStoryIdNoContent(storyId, Sort.by("chapterNumber").ascending());
    }

    public Map<String, Object> readChapter(String storyId, int chapterNumber, UserDetailsImpl user) {
        Story story = requireVisible(storyId, user);
        Chapter chapter = chapterRepository.findByStoryIdAndChapterNumber(storyId, chapterNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> result = new HashMap<>();
        result.put("chapter", chapter);
        result.put("hasPrev", chapterNumber > 1);
        result.put("hasNext", chapterRepository.findByStoryIdAndChapterNumber(storyId, chapterNumber + 1).isPresent());
        result.put("storyTitle", story.getTitle());
        return result;
    }

    public Chapter getChapterForEdit(String storyId, String chapterId, UserDetailsImpl user) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);
        return chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    // ---- user story management ----

    public List<Story> getMyStories(String userId) {
        return storyRepository.findByUploadedByOrderByCreatedAtDesc(userId);
    }

    public Story createStory(StoryRequest req, UserDetailsImpl userDetails) {
        if (!isAdminOrMod(userDetails)) {
            User dbUser = userRepository.findById(userDetails.getId()).orElseThrow();
            if (dbUser.getMemberStatus() != User.MemberStatus.APPROVED) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản chưa được duyệt để đăng truyện");
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
        story.setApprovalStatus(isAdminOrMod(userDetails) ? "APPROVED" : "PENDING");
        return storyRepository.save(story);
    }

    public Story updateStory(String id, StoryRequest req, UserDetailsImpl user) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);
        story.setTitle(req.getTitle());
        story.setAuthor(req.getAuthor());
        story.setDescription(req.getDescription());
        if (req.getCoverImage() != null) story.setCoverImage(req.getCoverImage());
        story.setGenres(req.getGenres());
        if (req.getStatus() != null) story.setStatus(req.getStatus());
        story.setUpdatedAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    public void deleteStory(String id, UserDetailsImpl user) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);
        chapterRepository.deleteByStoryId(id);
        storyRepository.deleteById(id);
    }

    // ---- admin approval ----

    public Page<Story> getPendingStories(int page, int size) {
        return storyRepository.findByApprovalStatusOrderByCreatedAtDesc("PENDING",
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Story approveStory(String id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        story.setApprovalStatus("APPROVED");
        story.setUpdatedAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    public Story rejectStory(String id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        story.setApprovalStatus("REJECTED");
        story.setUpdatedAt(LocalDateTime.now());
        return storyRepository.save(story);
    }

    // ---- chapters ----

    public Chapter addChapter(String storyId, ChapterRequest req, UserDetailsImpl user) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);

        long count = chapterRepository.countByStoryId(storyId);
        Chapter chapter = new Chapter();
        chapter.setStoryId(storyId);
        chapter.setChapterNumber(req.getChapterNumber() != null ? req.getChapterNumber() : (int) count + 1);
        chapter.setTitle(req.getTitle());
        chapter.setContent(req.getContent());
        chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
        chapter.setCreatedAt(LocalDateTime.now());
        Chapter saved = chapterRepository.save(chapter);

        story.setTotalChapters((int) chapterRepository.countByStoryId(storyId));
        story.setUpdatedAt(LocalDateTime.now());
        storyRepository.save(story);

        if (isApproved(story)) {
            String notifBody = "Chương " + saved.getChapterNumber() + ": " + saved.getTitle();
            storyFollowRepository.findByStoryId(storyId).forEach(follow ->
                    notificationService.send(follow.getUserId(), "NEW_CHAPTER",
                            "📖 " + story.getTitle() + " có chương mới!", notifBody,
                            "/stories/" + storyId + "/chapters/" + saved.getChapterNumber()));
        }
        return saved;
    }

    public Chapter updateChapter(String storyId, String chapterId, ChapterRequest req, UserDetailsImpl user) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        chapter.setTitle(req.getTitle());
        chapter.setContent(req.getContent());
        chapter.setWordCount(req.getContent() != null ? req.getContent().replaceAll("<[^>]*>", "").length() : 0);
        chapter.setUpdatedAt(LocalDateTime.now());
        return chapterRepository.save(chapter);
    }

    public void deleteChapter(String storyId, String chapterId, UserDetailsImpl user) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireManage(story, user);
        chapterRepository.deleteById(chapterId);
        story.setTotalChapters((int) chapterRepository.countByStoryId(storyId));
        storyRepository.save(story);
    }

    // ---- rating ----

    public Map<String, Object> rateStory(String id, int rating, String userId) {
        if (rating < 1 || rating > 5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be 1-5");
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        StoryRating existing = storyRatingRepository.findByStoryIdAndUserId(id, userId).orElse(null);
        if (existing != null) {
            existing.setRating(rating);
            existing.setUpdatedAt(LocalDateTime.now());
            storyRatingRepository.save(existing);
        } else {
            StoryRating newRating = new StoryRating();
            newRating.setStoryId(id);
            newRating.setUserId(userId);
            newRating.setRating(rating);
            newRating.setCreatedAt(LocalDateTime.now());
            storyRatingRepository.save(newRating);
        }
        List<StoryRating> all = storyRatingRepository.findByStoryId(id);
        double avg = all.stream().mapToInt(StoryRating::getRating).average().orElse(0);
        story.setAverageRating(Math.round(avg * 10.0) / 10.0);
        story.setRatingCount(all.size());
        storyRepository.save(story);
        return Map.of("averageRating", story.getAverageRating(), "ratingCount", story.getRatingCount(), "userRating", rating);
    }

    public Map<String, Object> getMyRating(String id, String userId) {
        StoryRating r = storyRatingRepository.findByStoryIdAndUserId(id, userId).orElse(null);
        return Map.of("rating", r != null ? r.getRating() : 0);
    }

    // ---- follow ----

    public Map<String, Object> toggleFollow(String id, UserDetailsImpl user) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean wasFollowing = storyFollowRepository.existsByStoryIdAndUserId(id, user.getId());
        if (wasFollowing) {
            storyFollowRepository.deleteByStoryIdAndUserId(id, user.getId());
        } else {
            StoryFollow follow = new StoryFollow();
            follow.setStoryId(id);
            follow.setStoryTitle(story.getTitle());
            follow.setCoverImage(story.getCoverImage());
            follow.setAuthor(story.getAuthor());
            follow.setUserId(user.getId());
            follow.setFollowedAt(LocalDateTime.now());
            storyFollowRepository.save(follow);
        }
        long count = storyFollowRepository.countByStoryId(id);
        return Map.of("following", !wasFollowing, "followerCount", count);
    }

    public Map<String, Object> getFollowStatus(String id, String userId) {
        boolean following = userId != null && storyFollowRepository.existsByStoryIdAndUserId(id, userId);
        long count = storyFollowRepository.countByStoryId(id);
        return Map.of("following", following, "followerCount", count);
    }

    // ---- comments ----

    public Page<ChapterComment> getComments(String storyId, int chapterNumber, int page, int size) {
        return commentRepository.findByStoryIdAndChapterNumberOrderByCreatedAtDesc(
                storyId, chapterNumber, PageRequest.of(page, size));
    }

    public ChapterComment addComment(String storyId, int chapterNumber, String content, UserDetailsImpl user) {
        if (content == null || content.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        ChapterComment comment = new ChapterComment();
        comment.setStoryId(storyId);
        comment.setChapterNumber(chapterNumber);
        comment.setUserId(user.getId());
        comment.setUsername(user.getUsername());
        comment.setDisplayName(user.getDisplayName());
        comment.setContent(content.trim());
        comment.setCreatedAt(LocalDateTime.now());
        userRepository.findByUsername(user.getUsername()).ifPresent(u -> {
            u.setExp(u.getExp() + 5);
            userRepository.save(u);
            comment.setExp(u.getExp());
            comment.setLevel(com.kiemhiep.util.UserLevel.getLevelName(u.getExp()));
        });
        return commentRepository.save(comment);
    }
}
