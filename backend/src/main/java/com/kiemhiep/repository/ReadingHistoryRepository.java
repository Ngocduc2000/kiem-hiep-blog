package com.kiemhiep.repository;

import com.kiemhiep.model.ReadingHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ReadingHistoryRepository extends MongoRepository<ReadingHistory, String> {
    List<ReadingHistory> findByUserIdOrderByReadAtDesc(String userId, Pageable pageable);
    Optional<ReadingHistory> findByUserIdAndStoryIdAndChapterNumber(String userId, String storyId, int chapterNumber);
    void deleteByUserId(String userId);
    long countByUserId(String userId);
}
