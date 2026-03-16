package com.kiemhiep.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/tts")
public class TtsController {

    @GetMapping
    public ResponseEntity<byte[]> tts(@RequestParam String text) {
        log.info("[GET /api/tts] text.length={}", text.length());
        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String urlStr = "https://translate.google.com/translate_tts?ie=UTF-8&q="
                    + encoded + "&tl=vi&client=tw-ob&ttsspeed=1";
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
            conn.setRequestProperty("Referer", "https://translate.google.com/");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(15000);
            byte[] audio = conn.getInputStream().readAllBytes();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .header("Cache-Control", "public, max-age=86400")
                    .body(audio);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
