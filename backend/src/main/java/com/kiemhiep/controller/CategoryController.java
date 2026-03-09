package com.kiemhiep.controller;

import com.kiemhiep.model.Category;
import com.kiemhiep.model.Topic;
import com.kiemhiep.repository.CategoryRepository;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryRepository categoryRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Category cat : categories) {
            long topicCount = topicRepository.countByCategoryIdAndStatus(cat.getId(), Topic.TopicStatus.APPROVED);
            // Lấy danh sách topicId trong category để đếm posts
            List<String> topicIds = topicRepository.findByCategoryIdAndStatus(
                    cat.getId(), Topic.TopicStatus.APPROVED, PageRequest.of(0, 1000))
                    .getContent().stream().map(t -> t.getId()).collect(Collectors.toList());
            long postCount = topicIds.isEmpty() ? 0 : postRepository.countByTopicIdIn(topicIds);

            Map<String, Object> dto = new HashMap<>();
            dto.put("id", cat.getId());
            dto.put("name", cat.getName());
            dto.put("slug", cat.getSlug());
            dto.put("description", cat.getDescription());
            dto.put("icon", cat.getIcon());
            dto.put("displayOrder", cat.getDisplayOrder());
            dto.put("topicCount", topicCount);
            dto.put("postCount", postCount);
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategory(@PathVariable String id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        category.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(@PathVariable String id, @RequestBody Category update) {
        return categoryRepository.findById(id).map(cat -> {
            cat.setName(update.getName());
            cat.setDescription(update.getDescription());
            cat.setIcon(update.getIcon());
            cat.setDisplayOrder(update.getDisplayOrder());
            return ResponseEntity.ok(categoryRepository.save(cat));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable String id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
