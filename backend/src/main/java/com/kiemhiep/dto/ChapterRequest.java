package com.kiemhiep.dto;

import lombok.Data;

@Data
public class ChapterRequest {
    private Integer chapterNumber;
    private String title;
    private String content;
}
