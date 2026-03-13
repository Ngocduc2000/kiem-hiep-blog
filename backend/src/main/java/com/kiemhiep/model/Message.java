package com.kiemhiep.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    @Indexed
    private String conversationId;
    @Indexed
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private boolean read = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
