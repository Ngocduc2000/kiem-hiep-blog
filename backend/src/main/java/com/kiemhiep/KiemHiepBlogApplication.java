package com.kiemhiep;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class KiemHiepBlogApplication {
    public static void main(String[] args) {
        SpringApplication.run(KiemHiepBlogApplication.class, args);
    }
}
