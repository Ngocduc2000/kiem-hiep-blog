package com.kiemhiep.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    @Indexed
    private String userId;
    private String type; // REPLY, APPROVE_USER, REJECT_USER, APPROVE_TOPIC, REJECT_TOPIC
    private String title;
    private String message;
    private String link;
    private boolean read = false;
    private LocalDateTime createdAt;
}
