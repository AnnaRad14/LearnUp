package com.learnup.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String id;       // ID користувача з MongoDB
    private String email;
    private String fullName;
    private String role;
    // 🔥 НОВІ ПОЛЯ ДЛЯ ЗБЕРЕЖЕННЯ ПРОГРЕСУ ПРИ ВХОДІ
    private List<String> unlockedCourseIds;
    private List<String> completedLessonIds;

    // Оновлюємо конструктор, додаючи нові параметри в кінець
    public AuthResponse(String token, String id, String email, String fullName, String role,
                        List<String> unlockedCourseIds, List<String> completedLessonIds) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.unlockedCourseIds = unlockedCourseIds;
        this.completedLessonIds = completedLessonIds;
    }
}