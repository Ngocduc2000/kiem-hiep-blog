package com.kiemhiep.dto;

import com.kiemhiep.model.Story;
import lombok.Data;
import java.util.List;

@Data
public class StoryRequest {
    private String title;
    private String author;
    private String description;
    private String coverImage;
    private List<String> genres;
    private Story.StoryStatus status;
}
