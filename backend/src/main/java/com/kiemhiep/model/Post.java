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
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String topicId;
    private String content;
    private String authorId;
    private String authorUsername;
    private String authorName;
    private String authorAvatar;
    private int authorPostCount;

    private PostStatus status = PostStatus.PENDING;
    private boolean isFirstPost = false; // First post = topic description

    private List<String> likedByUsers = new ArrayList<>();
    private int likeCount = 0;

    private String quotedPostId;
    private String quotedContent;
    private String quotedAuthorName;

    @CreatedDate
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
    private String approvedBy;

    public enum PostStatus {
        PENDING, APPROVED, REJECTED
    }
}
