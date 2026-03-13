package com.kiemhiep.dto;

import lombok.Data;

@Data
public class AnnouncementRequest {
    private String title;
    private String content;
    private String type;
    private boolean pinned = true;
}
