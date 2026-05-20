package com.learnup.models;

import lombok.Data;
import java.util.List;

@Data
public class Topic {
    private String topicTitle;
    private List<Course.Lesson> lessons;
}