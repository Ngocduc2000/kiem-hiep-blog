package com.kiemhiep.controller;

import com.kiemhiep.model.Chapter;
import com.kiemhiep.model.Story;
import com.kiemhiep.repository.ChapterRepository;
import com.kiemhiep.repository.StoryRepository;
import com.kiemhiep.security.UserDetailsImpl;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    // PUBLIC
    @GetMapping
    public ResponseEntity<?> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(storyRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStory(@PathVariable String id) {
        return storyRepository.findById(id).map(story -> {
            story.setViewCount(story.getViewCount() + 1);
            storyRepository.save(story);
            Map<String, Object> result = new HashMap<>();
            result.put("story", story);
            result.put("chapters", chapterRepository.findByStoryIdOrderByChapterNumberAsc(id)
                .stream().map(ch -> {
                    Map<String, Object> chInfo = new HashMap<>();
                    chInfo.put("id", ch.getId());
                    chInfo.put("chapterNumber", ch.getChapterNumber());
                    chInfo.put("title", ch.getTitle());
                    chInfo.put("createdAt", ch.getCreatedAt());
                    return chInfo;
                }).toList());
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/chapters/{chapterNumber}")
    public ResponseEntity<?> getChapter(@PathVariable String id, @PathVariable int chapterNumber) {
        return chapterRepository.findByStoryIdAndChapterNumber(id, chapterNumber)
                .map(chapter -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("chapter", chapter);
                    // prev/next
                    result.put("hasPrev", chapterNumber > 1);
                    result.put("hasNext", chapterRepository.findByStoryIdAndChapterNumber(id, chapterNumber + 1).isPresent());
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ADMIN
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
}
