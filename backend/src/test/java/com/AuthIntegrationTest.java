package com;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnup.dto.RegisterRequest;
import com.learnup.models.User;
import com.learnup.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ВИПРАВЛЕНО: Примусово вказуємо Spring використовувати тестову базу даних для цього класу
@SpringBootTest(
        classes = com.learnup.Main.class,
        properties = "spring.data.mongodb.database=learnup_test_db"
)
@AutoConfigureMockMvc
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        // Очищення прибрано, але тепер це не важливо, бо основна база додатка взагалку не зачіпається!
    }

    // ==========================================
    // USER STORY 1: РЕЄСТРАЦІЯ КОРИСТУВАЧА
    // ==========================================

    @Test
    public void testRegister_PositiveScenario() throws Exception {
        String uniqueEmail = "positive" + System.currentTimeMillis() + "@learnup.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(uniqueEmail);
        request.setPassword("pass123");
        request.setFullName("Ivan Ivanov");
        request.setRole(com.learnup.models.Role.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.token").exists());

        assertTrue(userRepository.existsByEmail(uniqueEmail));
    }

    @Test
    public void testRegister_NegativeScenario_EmailAlreadyExists() {
        String duplicateEmail = "duplicate" + System.currentTimeMillis() + "@learnup.com";

        User existingUser = new User();
        existingUser.setEmail(duplicateEmail);
        existingUser.setPassword("encoded_pass");
        existingUser.setFullName("Existing User");
        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest();
        request.setEmail(duplicateEmail);
        request.setPassword("newpass123");
        request.setFullName("New User");

        jakarta.servlet.ServletException exception = org.junit.jupiter.api.Assertions.assertThrows(
                jakarta.servlet.ServletException.class,
                () -> mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        );

        assertTrue(exception.getCause().getMessage().contains("Email вже зайнятий!"));
    }

    // ==========================================
    // USER STORY 2: КЕРУВАННЯ ПРОФІЛЕМ КОРИСТУВАЧА
    // ==========================================

    @Test
    public void testUpdateProfile_PositiveScenario() throws Exception {
        User user = new User();
        user.setEmail("student" + System.currentTimeMillis() + "@learnup.com");
        user.setFullName("Old Name");
        user.setAvatar("old_avatar.png");
        User savedUser = userRepository.save(user);

        Map<String, Object> updates = new HashMap<>();
        updates.put("fullName", "New Super Name");
        updates.put("avatar", "new_cool_avatar.png");

        mockMvc.perform(put("/api/users/" + savedUser.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("New Super Name"))
                .andExpect(jsonPath("$.avatar").value("new_cool_avatar.png"));

        User updatedUserInDb = userRepository.findById(savedUser.getId()).orElseThrow();
        assertEquals("New Super Name", updatedUserInDb.getFullName());
    }

    @Test
    public void testUpdateProfile_NegativeScenario_UserNotFound() throws Exception {
        Map<String, Object> updates = new HashMap<>();
        updates.put("fullName", "Nobody");

        mockMvc.perform(put("/api/users/fake-id-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isNotFound());
    }
}