package com.learnup.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.learnup.repositories.UserRepository;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 🔥 ДОДАНО ДЛЯ АДМІН-ПАНЕЛІ: Отримання всіх користувачів для статистики
    // Тепер запит GET http://localhost:8080/api/users/admin/users поверне список і зніме помилку 403
    @GetMapping("/admin/users")
    public ResponseEntity<List<com.learnup.models.User>> getAllUsersForAdmin() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUserProfile(@PathVariable String userId, @RequestBody Map<String, Object> updates) {
        // Шукаємо користувача за ID або за Email
        com.learnup.models.User user = userRepository.findById(userId)
                .orElseGet(() -> userRepository.findByEmail(userId)
                        .orElse(null));

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // 1. Оновлюємо ім'я
        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
        }

        // 2. Оновлюємо аватарку
        if (updates.containsKey("avatar")) {
            user.setAvatar((String) updates.get("avatar"));
        }

        // Зберігаємо оновленого юзера в MongoDB
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }

    @PostMapping("/{userId}/lessons/complete")
    public ResponseEntity<?> completeLesson(@PathVariable String userId, @RequestBody Map<String, String> request) {
        String lessonTitle = request.get("lessonTitle");

        if (lessonTitle == null || lessonTitle.isEmpty()) {
            return ResponseEntity.badRequest().body("Назва уроку не може бути порожньою");
        }

        return userRepository.findById(userId).map(user -> {
            if (!user.getCompletedLessonIds().contains(lessonTitle)) {
                user.getCompletedLessonIds().add(lessonTitle);
                userRepository.save(user);
            }
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> userRepository.findByEmail(userId)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build()));
    }

    @PostMapping("/{userId}/enroll")
    public ResponseEntity<?> enrollInCourse(@PathVariable String userId, @RequestBody Map<String, String> request) {
        String courseId = request.get("courseId");

        com.learnup.models.User user = userRepository.findById(userId)
                .orElseGet(() -> userRepository.findByEmail(userId)
                        .orElseThrow(() -> new RuntimeException("Користувача не знайдено")));

        if (user.getUnlockedCourseIds() == null) {
            user.setUnlockedCourseIds(new java.util.ArrayList<>());
        }

        if (!user.getUnlockedCourseIds().contains(courseId)) {
            user.getUnlockedCourseIds().add(courseId);
            userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/admin/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String userId, @RequestBody Map<String, String> request) {
        String newRoleStr = request.get("role");

        if (newRoleStr == null || newRoleStr.isEmpty()) {
            return ResponseEntity.badRequest().body("Роль не може бути порожньою");
        }

        // Шукаємо користувача в базі
        com.learnup.models.User user = userRepository.findById(userId)
                .orElseGet(() -> userRepository.findByEmail(userId).orElse(null));

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Перетворюємо String у об'єкт Enum Role (наприклад, Role.TEACHER або Role.STUDENT)
            com.learnup.models.Role roleEnum = com.learnup.models.Role.valueOf(newRoleStr.toUpperCase());
            user.setRole(roleEnum);

            userRepository.save(user);
            return ResponseEntity.ok(user);

        } catch (IllegalArgumentException e) {
            // Якщо з фронтенду прийде якась невідома роль, якої немає в Enum
            return ResponseEntity.badRequest().body("Невідома роль: " + newRoleStr);
        }
    }
}