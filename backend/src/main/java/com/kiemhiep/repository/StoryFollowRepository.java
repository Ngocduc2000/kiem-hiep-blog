package com.kiemhiep.repository;

import com.kiemhiep.model.StoryFollow;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface StoryFollowRepository extends MongoRepository<StoryFollow, String> {
    Optional<StoryFollow> findByStoryIdAndUserId(String storyId, String userId);
    List<StoryFollow> findByUserIdOrderByFollowedAtDesc(String userId);
    List<StoryFollow> findByStoryId(String storyId);
    long countByStoryId(String storyId);
    boolean existsByStoryIdAndUserId(String storyId, String userId);
    void deleteByStoryIdAndUserId(String storyId, String userId);
}
