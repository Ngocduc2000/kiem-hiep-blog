package com.kiemhiep.util;

public class UserLevel {

    public static final long[][] THRESHOLDS = {
        {0,      0},   // Ngưng Khí
        {1,    100},   // Trúc Cơ
        {2,    300},   // Kim Đan
        {3,    700},   // Nguyên Anh
        {4,   1500},   // Thiên Nhân
        {5,   3000},   // Bán Thần
        {6,   6000},   // Thiên Tôn
        {7,  12000},   // Thái Cổ
        {8,  25000},   // Chúa Tể
        {9,  50000},   // Tối Cường Chúa Tể
        {10, 100000},  // Vĩnh Hằng
    };

    public static final String[] NAMES = {
        "Ngưng Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh",
        "Thiên Nhân", "Bán Thần", "Thiên Tôn", "Thái Cổ",
        "Chúa Tể", "Tối Cường Chúa Tể", "Vĩnh Hằng"
    };

    public static int getLevelIndex(long exp) {
        int level = 0;
        for (int i = 0; i < THRESHOLDS.length; i++) {
            if (exp >= THRESHOLDS[i][1]) level = i;
        }
        return level;
    }

    public static String getLevelName(long exp) {
        return NAMES[getLevelIndex(exp)];
    }

    public static long getNextThreshold(long exp) {
        int idx = getLevelIndex(exp);
        if (idx >= THRESHOLDS.length - 1) return THRESHOLDS[THRESHOLDS.length - 1][1];
        return THRESHOLDS[idx + 1][1];
    }

    public static long getCurrentThreshold(long exp) {
        return THRESHOLDS[getLevelIndex(exp)][1];
    }
}
