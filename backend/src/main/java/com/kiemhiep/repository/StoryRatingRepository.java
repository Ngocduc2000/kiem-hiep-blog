package com.kiemhiep.repository;

import com.kiemhiep.model.StoryRating;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface StoryRatingRepository extends MongoRepository<StoryRating, String> {
    Optional<StoryRating> findByStoryIdAndUserId(String storyId, String userId);
    List<StoryRating> findByStoryId(String storyId);
}
