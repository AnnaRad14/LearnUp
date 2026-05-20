package com.learnup.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String fullName;

    // 🔥 ДОДАНО: Поле для збереження аватарки (емодзі або Base64 рядка)
    private String avatar;

    private Role role;
    private double balance = 0.0;

    private List<String> unlockedCourseIds = new ArrayList<>();
    private LocalDateTime createdAt = LocalDateTime.now();
    private List<String> completedLessonIds = new ArrayList<>();
}