package com.kiemhiep.dto;

import lombok.Data;
import java.util.List;

@Data
public class TopicRequest {
    private String title;
    private String categoryId;
    private String content;
    private List<String> tags;
}
