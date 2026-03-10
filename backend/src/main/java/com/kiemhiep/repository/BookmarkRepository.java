package com.kiemhiep.repository;

import com.kiemhiep.model.Bookmark;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends MongoRepository<Bookmark, String> {
    List<Bookmark> findByUserIdOrderBySavedAtDesc(String userId);
    Optional<Bookmark> findByUserIdAndStoryId(String userId, String storyId);
    void deleteByUserIdAndStoryId(String userId, String storyId);
    boolean existsByUserIdAndStoryId(String userId, String storyId);
}
