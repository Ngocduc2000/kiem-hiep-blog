package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "reactions")
@CompoundIndexes({
        @CompoundIndex(name = "unique_reaction",
                def = "{'targetId': 1, 'userId': 1, 'targetType': 1}", unique = true)
})
public class Reaction {
    @Id
    private String id;

    private String targetId;
    private String targetType; // "POST" hoặc "TOPIC"
    private String userId;
    private String username;
    private ReactionType type;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum ReactionType {
        LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    }
}
