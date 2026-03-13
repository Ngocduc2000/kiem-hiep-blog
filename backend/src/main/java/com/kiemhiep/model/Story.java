package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@Document(collection = "stories")
public class Story {
    @Id
    private String id;
    private String title;
    private String author;        // tên tác giả gốc
    private String description;
    private String coverImage;    // URL ảnh bìa
    private List<String> genres = new ArrayList<>();  // thể loại: kiếm hiệp, tiên hiệp...
    private StoryStatus status = StoryStatus.ONGOING;
    private int totalChapters = 0;
    private long viewCount = 0;
    private double averageRating = 0;
    private int ratingCount = 0;
    private String uploadedBy;        // userId của người đăng
    private String approvalStatus;    // null/"APPROVED" = hiển thị, "PENDING" = chờ duyệt, "REJECTED" = bị từ chối
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum StoryStatus {
        ONGOING, COMPLETED
    }
}
