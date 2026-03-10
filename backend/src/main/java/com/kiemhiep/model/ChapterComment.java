package com.kiemhiep.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "chapter_comments")
public class ChapterComment {
    @Id
    private String id;

    @Indexed
    private String storyId;

    @Indexed
    private int chapterNumber;

    private String userId;
    private String username;
    private String displayName;
    private String level; // cultivation level at time of comment
    private long exp;
    private String content;
    private LocalDateTime createdAt;
}
