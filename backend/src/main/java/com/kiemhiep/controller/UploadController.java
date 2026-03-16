package com.kiemhiep.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final Cloudinary cloudinary;

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        Authentication auth) throws IOException {
        if (auth == null) return ResponseEntity.status(401).body("Chưa đăng nhập!");
        log.info("[POST /api/upload] userId={} fileName={} contentType={}", ((com.kiemhiep.security.UserDetailsImpl) auth.getPrincipal()).getId(), file.getOriginalFilename(), file.getContentType());

        String contentType = file.getContentType() != null ? file.getContentType() : "";
        String resourceType;

        if (contentType.startsWith("image/")) resourceType = "image";
        else if (contentType.startsWith("video/")) resourceType = "video";
        else resourceType = "raw";

        Map<String, Object> options = ObjectUtils.asMap(
                "resource_type", resourceType,
                "folder", "kiemhiep-blog",
                "use_filename", true,
                "unique_filename", true
        );

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

        Map<String, Object> response = new HashMap<>();
        response.put("url", uploadResult.get("secure_url"));
        response.put("publicId", uploadResult.get("public_id"));
        response.put("resourceType", resourceType);
        response.put("format", uploadResult.get("format"));
        response.put("originalName", file.getOriginalFilename());
        response.put("size", file.getSize());

        return ResponseEntity.ok(response);
    }
}
