package com.learnup.repositories;

import com.learnup.models.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CourseRepository extends MongoRepository<Course, String> {
    List<Course> findByAuthorId(String authorId);
}
