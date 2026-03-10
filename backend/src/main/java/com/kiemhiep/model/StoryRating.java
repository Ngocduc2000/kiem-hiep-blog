package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "story_ratings")
@CompoundIndex(name = "story_user_idx", def = "{'storyId': 1, 'userId': 1}", unique = true)
public class StoryRating {
    @Id
    private String id;
    private String storyId;
    private String userId;
    private int rating; // 1-5
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
