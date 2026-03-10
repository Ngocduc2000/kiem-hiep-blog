package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "announcements")
public class Announcement {
    @Id
    private String id;
    private String title;
    private String content;
    private String type = "INFO"; // INFO, WARNING, EVENT
    private boolean pinned = true;
    private String createdBy; // username
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
