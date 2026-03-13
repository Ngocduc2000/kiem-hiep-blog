package com.kiemhiep.service;

import com.kiemhiep.dto.BookmarkRequest;
import com.kiemhiep.dto.HistoryRequest;
import com.kiemhiep.model.Bookmark;
import com.kiemhiep.model.ReadingHistory;
import com.kiemhiep.model.StoryFollow;
import com.kiemhiep.repository.BookmarkRepository;
import com.kiemhiep.repository.ReadingHistoryRepository;
import com.kiemhiep.repository.StoryFollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserLibraryService {

    private final BookmarkRepository bookmarkRepository;
    private final ReadingHistoryRepository historyRepository;
    private final StoryFollowRepository storyFollowRepository;

    public List<StoryFollow> getFollowing(String userId) {
        return storyFollowRepository.findByUserIdOrderByFollowedAtDesc(userId);
    }

    public List<Bookmark> getBookmarks(String userId) {
        return bookmarkRepository.findByUserIdOrderBySavedAtDesc(userId);
    }

    public Map<String, Object> toggleBookmark(BookmarkRequest req, String userId) {
        var existing = bookmarkRepository.findByUserIdAndStoryId(userId, req.getStoryId());
        if (existing.isPresent()) {
            Bookmark bm = existing.get();
            bm.setChapterNumber(req.getChapterNumber());
            bm.setChapterTitle(req.getChapterTitle());
            bm.setSavedAt(LocalDateTime.now());
            return Map.of("action", "updated", "bookmark", bookmarkRepository.save(bm));
        }
        Bookmark bm = new Bookmark();
        bm.setUserId(userId);
        bm.setStoryId(req.getStoryId());
        bm.setStoryTitle(req.getStoryTitle());
        bm.setCoverImage(req.getCoverImage());
        bm.setAuthor(req.getAuthor());
        bm.setChapterNumber(req.getChapterNumber());
        bm.setChapterTitle(req.getChapterTitle());
        bm.setSavedAt(LocalDateTime.now());
        return Map.of("action", "added", "bookmark", bookmarkRepository.save(bm));
    }

    public void removeBookmark(String storyId, String userId) {
        bookmarkRepository.deleteByUserIdAndStoryId(userId, storyId);
    }

    public Map<String, Object> checkBookmark(String storyId, String userId) {
        return Map.of("bookmarked", bookmarkRepository.existsByUserIdAndStoryId(userId, storyId));
    }

    public List<ReadingHistory> getHistory(String userId, int page, int size) {
        return historyRepository.findByUserIdOrderByReadAtDesc(userId, PageRequest.of(page, size));
    }

    public void recordHistory(HistoryRequest req, String userId) {
        var existing = historyRepository.findByUserIdAndStoryIdAndChapterNumber(
                userId, req.getStoryId(), req.getChapterNumber());
        ReadingHistory h = existing.orElse(new ReadingHistory());
        h.setUserId(userId);
        h.setStoryId(req.getStoryId());
        h.setStoryTitle(req.getStoryTitle());
        h.setCoverImage(req.getCoverImage());
        h.setAuthor(req.getAuthor());
        h.setChapterNumber(req.getChapterNumber());
        h.setChapterTitle(req.getChapterTitle());
        h.setReadAt(LocalDateTime.now());
        historyRepository.save(h);
    }

    public void clearHistory(String userId) {
        historyRepository.deleteByUserId(userId);
    }
}
