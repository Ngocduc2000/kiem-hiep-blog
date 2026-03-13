package com.kiemhiep.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String displayName;
    private String bio;
    private String avatar;
}
