package com.kiemhiep.dto;

import lombok.Data;

@Data
public class HistoryRequest {
    private String storyId;
    private String storyTitle;
    private String coverImage;
    private String author;
    private int chapterNumber;
    private String chapterTitle;
}
