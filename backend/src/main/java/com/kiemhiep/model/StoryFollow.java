package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "story_follows")
@CompoundIndex(name = "story_user_idx", def = "{'storyId': 1, 'userId': 1}", unique = true)
public class StoryFollow {
    @Id
    private String id;
    private String storyId;
    private String storyTitle;
    private String coverImage;
    private String author;
    private String userId;
    private LocalDateTime followedAt;
}
