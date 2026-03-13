package com.kiemhiep.service;

import com.kiemhiep.model.Category;
import com.kiemhiep.model.Topic;
import com.kiemhiep.repository.CategoryRepository;
import com.kiemhiep.repository.PostRepository;
import com.kiemhiep.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;

    public List<Map<String, Object>> getCategories() {
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Category cat : categories) {
            long topicCount = topicRepository.countByCategoryIdAndStatus(cat.getId(), Topic.TopicStatus.APPROVED);
            List<String> topicIds = topicRepository
                    .findByCategoryIdAndStatus(cat.getId(), Topic.TopicStatus.APPROVED, PageRequest.of(0, 1000))
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
        return result;
    }

    public Category getCategory(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public Category createCategory(Category category) {
        category.setCreatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public Category updateCategory(String id, Category update) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        cat.setName(update.getName());
        cat.setDescription(update.getDescription());
        cat.setIcon(update.getIcon());
        cat.setDisplayOrder(update.getDisplayOrder());
        return categoryRepository.save(cat);
    }

    public void deleteCategory(String id) {
        categoryRepository.deleteById(id);
    }
}
