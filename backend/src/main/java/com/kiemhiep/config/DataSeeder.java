package com.kiemhiep.config;

import com.kiemhiep.model.Category;
import com.kiemhiep.model.User;
import com.kiemhiep.repository.CategoryRepository;
import com.kiemhiep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCategories();
    }

    private void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@kiemhiep.vn");
            admin.setPassword(passwordEncoder.encode("Admin@123456"));
            admin.setDisplayName("Quản Trị Viên");
            admin.setRoles(Set.of("ADMIN", "USER"));
            admin.setMemberStatus(User.MemberStatus.APPROVED);
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            System.out.println(">>> Admin created: admin / Admin@123456");
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                createCategory("Kiếm Hiệp", "kiem-hiep",
                    "Bàn luận về các tác phẩm kiếm hiệp: Kim Dung, Cổ Long, Lương Vũ Sinh...", "⚔️", 1),
                createCategory("Tiên Hiệp", "tien-hiep",
                    "Thế giới tu tiên, luyện đan, thành thần...", "🌟", 2),
                createCategory("Huyền Huyễn", "huyen-huyen",
                    "Phép thuật, ma pháp, dị giới...", "🔮", 3),
                createCategory("Đô Thị", "do-thi",
                    "Truyện đô thị, trọng sinh, xuyên không...", "🏙️", 4),
                createCategory("Lịch Sử", "lich-su",
                    "Tiểu thuyết lịch sử, cung đình, chiến tranh...", "📜", 5),
                createCategory("Đề Cử Hay", "de-cu-hay",
                    "Giới thiệu truyện hay, review, đánh giá...", "📚", 6),
                createCategory("Góc Sáng Tác", "goc-sang-tac",
                    "Tự sáng tác, fanfiction, dịch thuật...", "✍️", 7),
                createCategory("Tán Gẫu", "tan-gau",
                    "Chém gió, tám chuyện, off-topic...", "💬", 8)
            );
            categoryRepository.saveAll(categories);
            System.out.println(">>> " + categories.size() + " categories seeded");
        }
    }

    private Category createCategory(String name, String slug, String desc, String icon, int order) {
        Category cat = new Category();
        cat.setName(name);
        cat.setSlug(slug);
        cat.setDescription(desc);
        cat.setIcon(icon);
        cat.setDisplayOrder(order);
        cat.setCreatedAt(LocalDateTime.now());
        return cat;
    }
}
