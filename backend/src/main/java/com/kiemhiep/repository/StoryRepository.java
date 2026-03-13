package com.kiemhiep.repository;

import com.kiemhiep.model.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryRepository extends MongoRepository<Story, String> {

    // Public: chỉ trả về story đã duyệt (approvalStatus = null hoặc "APPROVED")
    @Query("{ 'approvalStatus': { $in: [null, 'APPROVED'] } }")
    Page<Story> findAllApproved(Pageable pageable);

    @Query("{ 'approvalStatus': { $in: [null, 'APPROVED'] }, $or: [{ 'title': { $regex: ?0, $options: 'i' } }, { 'author': { $regex: ?0, $options: 'i' } }] }")
    Page<Story> findApprovedByQuery(String q, Pageable pageable);

    @Query("{ 'approvalStatus': { $in: [null, 'APPROVED'] }, 'status': ?0 }")
    Page<Story> findApprovedByStatus(String status, Pageable pageable);

    @Query("{ 'approvalStatus': { $in: [null, 'APPROVED'] }, 'status': ?1, 'title': { $regex: ?0, $options: 'i' } }")
    Page<Story> findApprovedByTitleAndStatus(String title, String status, Pageable pageable);

    // Admin: truyện chờ duyệt
    Page<Story> findByApprovalStatusOrderByCreatedAtDesc(String approvalStatus, Pageable pageable);

    // User: truyện của mình
    List<Story> findByUploadedByOrderByCreatedAtDesc(String uploadedBy);

    // Legacy queries (vẫn giữ để tương thích)
    List<Story> findTop12ByOrderByViewCountDesc();
    List<Story> findTop12ByOrderByCreatedAtDesc();
}
