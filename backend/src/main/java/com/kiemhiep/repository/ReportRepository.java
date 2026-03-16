package com.kiemhiep.repository;

import com.kiemhiep.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {
    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);
    Page<Report> findAll(Pageable pageable);
    Optional<Report> findByReporterIdAndTargetIdAndTargetType(String reporterId, String targetId, String targetType);
    long countByStatus(Report.ReportStatus status);
}
