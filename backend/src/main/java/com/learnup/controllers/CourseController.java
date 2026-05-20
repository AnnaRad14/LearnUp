package com.learnup.controllers;

import com.learnup.models.Course;
import com.learnup.repositories.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000") // Дозволяємо запити з React
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    // 1. Створення курсу з фронтенду (Кристально чистий метод)
    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        // Якщо фронтенд раптом не передав ID автора (викладача), ставимо дефолтного для страховки
        if (course.getAuthorId() == null || course.getAuthorId().isEmpty()) {
            course.setAuthorId("64f1b5_ANTON_ID");
            course.setAuthorName("Anton");
        }

        // Автоматично ставимо статус очікування модерації для нових курсів
        if (course.getStatus() == null || course.getStatus().isEmpty()) {
            course.setStatus("PENDING");
        }

        // Зберігаємо курс у базу MongoDB. Jackson сам автоматично розкладе JSON у модулі та матеріали.
        Course savedCourse = courseRepository.save(course);
        return ResponseEntity.ok(savedCourse);
    }

    // 2. Отримання всіх курсів платформи
    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }

    // 3. ЕНДПОЇНТ ДЛЯ АДМІНА: Схвалення курсу
    @PutMapping("/admin/courses/{id}/approve")
    public ResponseEntity<Course> approveCourse(@PathVariable String id) {
        Optional<Course> courseOptional = courseRepository.findById(id);

        if (courseOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOptional.get();
        course.setStatus("APPROVED"); // Змінюємо статус на Схвалено (Активний)
        Course updatedCourse = courseRepository.save(course);

        return ResponseEntity.ok(updatedCourse);
    }

    // 4. Видалення курсу за його ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable String id) {
        if (!courseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // 5. Пошук курсів конкретного викладача
    @GetMapping("/teacher/{authorId}")
    public ResponseEntity<List<Course>> getCoursesByTeacher(@PathVariable String authorId) {
        return ResponseEntity.ok(courseRepository.findByAuthorId(authorId));
    }
}