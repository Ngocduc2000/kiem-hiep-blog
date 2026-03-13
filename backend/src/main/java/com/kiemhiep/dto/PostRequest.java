package com.kiemhiep.dto;

import lombok.Data;

@Data
public class PostRequest {
    private String content;
    private String quotedPostId;
    private String quotedContent;
    private String quotedAuthorName;
}
