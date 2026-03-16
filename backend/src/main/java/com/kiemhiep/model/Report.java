package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "reports")
public class Report {
    @Id
    private String id;

    private String reporterId;
    private String reporterUsername;

    private String targetId;
    private String targetType; // "TOPIC", "POST", "CHAPTER_COMMENT"

    private String reason; // "SPAM", "OFFENSIVE", "MISINFORMATION", "OTHER"
    private String description;

    private ReportStatus status = ReportStatus.PENDING;

    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String resolution;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum ReportStatus {
        PENDING, RESOLVED, DISMISSED
    }
}
