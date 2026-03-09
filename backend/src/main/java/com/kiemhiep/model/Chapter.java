package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "chapters")
public class Chapter {
    @Id
    private String id;
    private String storyId;
    private int chapterNumber;
    private String title;
    private String content;       // HTML content
    private int wordCount = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
