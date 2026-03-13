package com.kiemhiep.service;

import com.kiemhiep.dto.AnnouncementRequest;
import com.kiemhiep.model.Announcement;
import com.kiemhiep.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public List<Announcement> getPinned() {
        return announcementRepository.findByPinnedTrueOrderByCreatedAtDesc();
    }

    public List<Announcement> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    public Announcement create(AnnouncementRequest req, String createdBy) {
        Announcement ann = new Announcement();
        ann.setTitle(req.getTitle());
        ann.setContent(req.getContent());
        ann.setType(req.getType() != null ? req.getType() : "INFO");
        ann.setPinned(req.isPinned());
        ann.setCreatedBy(createdBy);
        ann.setCreatedAt(LocalDateTime.now());
        return announcementRepository.save(ann);
    }

    public Announcement update(String id, AnnouncementRequest req) {
        Announcement ann = announcementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ann.setTitle(req.getTitle());
        ann.setContent(req.getContent());
        if (req.getType() != null) ann.setType(req.getType());
        ann.setPinned(req.isPinned());
        ann.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(ann);
    }

    public void delete(String id) {
        announcementRepository.deleteById(id);
    }
}
