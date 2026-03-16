package com.kiemhiep.controller;

import com.kiemhiep.model.Report;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.ReportRepository;
import com.kiemhiep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> submitReport(@RequestBody Map<String, String> body, Authentication auth) {
        String targetId = body.get("targetId");
        String targetType = body.get("targetType");
        String reason = body.get("reason");
        String description = body.get("description");

        if (targetId == null || targetType == null || reason == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin báo cáo"));
        }

        User reporter = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // Prevent duplicate reports from same user
        if (reportRepository.findByReporterIdAndTargetIdAndTargetType(reporter.getId(), targetId, targetType).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã báo cáo nội dung này rồi"));
        }

        Report report = new Report();
        report.setReporterId(reporter.getId());
        report.setReporterUsername(reporter.getUsername());
        report.setTargetId(targetId);
        report.setTargetType(targetType);
        report.setReason(reason);
        report.setDescription(description);

        reportRepository.save(report);
        log.info("[POST /api/reports] user={} targetType={} targetId={} reason={}", auth.getName(), targetType, targetId, reason);
        return ResponseEntity.ok(Map.of("message", "Báo cáo đã được gửi"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        log.info("[GET /api/reports] page={} size={} status={}", page, size, status);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Report> result;
        if (status != null && !status.isBlank()) {
            result = reportRepository.findByStatus(Report.ReportStatus.valueOf(status), pageable);
        } else {
            result = reportRepository.findAll(pageable);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> resolveReport(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        log.info("[POST /api/reports/{}/resolve] by={}", id, auth.getName());
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        report.setStatus(Report.ReportStatus.RESOLVED);
        report.setReviewedBy(auth.getName());
        report.setReviewedAt(LocalDateTime.now());
        report.setResolution(body.get("resolution"));
        return ResponseEntity.ok(reportRepository.save(report));
    }

    @PostMapping("/{id}/dismiss")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOD')")
    public ResponseEntity<?> dismissReport(@PathVariable String id, Authentication auth) {
        log.info("[POST /api/reports/{}/dismiss] by={}", id, auth.getName());
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        report.setStatus(Report.ReportStatus.DISMISSED);
        report.setReviewedBy(auth.getName());
        report.setReviewedAt(LocalDateTime.now());
        return ResponseEntity.ok(reportRepository.save(report));
    }
}
