package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@Document(collection = "topics")
public class Topic {
    @Id
    private String id;
    private String title;
    private String slug;
    private String categoryId;
    private String authorId;
    private String authorName;
    private String authorAvatar;

    private TopicStatus status = TopicStatus.PENDING;
    private boolean pinned = false;
    private boolean locked = false;
    private boolean hot = false;

    private int viewCount = 0;
    private int replyCount = 0;
    private int likeCount = 0;

    private List<String> tags = new ArrayList<>();

    private String lastReplyUserId;
    private String lastReplyUsername;
    private LocalDateTime lastReplyAt;

    @CreatedDate
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum TopicStatus {
        PENDING, APPROVED, REJECTED
    }
}
