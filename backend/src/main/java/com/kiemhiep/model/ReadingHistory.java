package com.kiemhiep.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.LocalDateTime;

@Data
@Document(collection = "reading_history")
@CompoundIndex(def = "{'userId': 1, 'storyId': 1, 'chapterNumber': 1}", unique = true)
public class ReadingHistory {
    @Id
    private String id;
    private String userId;
    private String storyId;
    private String storyTitle;
    private String coverImage;
    private String author;
    private int chapterNumber;
    private String chapterTitle;
    private LocalDateTime readAt;
}
