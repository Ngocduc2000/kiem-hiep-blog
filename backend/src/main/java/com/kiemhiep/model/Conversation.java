package com.kiemhiep.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "conversations")
@CompoundIndex(def = "{'participantIds': 1}")
public class Conversation {
    @Id
    private String id;
    @Indexed
    private String participant1Id;
    @Indexed
    private String participant2Id;
    private List<String> participantIds; // [participant1Id, participant2Id] for easier querying
    private String lastMessageId;
    private String lastMessageContent;
    private int unreadCount1 = 0; // unread messages for participant1
    private int unreadCount2 = 0; // unread messages for participant2
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
