package com.learnup.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "courses")
@Data
public class Course {
    @Id
    private String id;
    private String title;
    private String description;
    private String category;
    private double price;
    private String authorId;
    private String authorName;
    private String status;

    // 🔥 Один єдиний правильний масив модулів для React
    private List<Module> modules = new ArrayList<>();

    @Data
    public static class Module {
        private String title;
        private List<Lesson> lessons = new ArrayList<>();
    }

    @Data
    public static class Lesson {
        private String title;
        private String contentUrl; // Посилання на відео (YouTube/Vimeo тощо)

        // 🔥 Безкінечний динамічний масив конспектів та фотографій з конструктора
        private List<LessonMaterial> materials = new ArrayList<>();

        // 💡 Залишаємо ці поля ТІЛЬКИ для зворотної сумісності (якщо в БД є старі записи)
        private String textContent;
        private String photo;
        private boolean showText;
        private boolean showPhoto;
        private String type;
    }

    @Data
    public static class LessonMaterial {
        private String type;  // Набуде значення "TEXT" або "PHOTO"
        private String value; // Текст конспекту або Base64 рядок фотографії
    }
}