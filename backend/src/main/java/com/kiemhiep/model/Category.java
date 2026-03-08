package com.kiemhiep.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "categories")
public class Category {
    @Id
    private String id;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private int displayOrder;
    private int topicCount = 0;
    private int postCount = 0;
    @CreatedDate
    private LocalDateTime createdAt;
}
