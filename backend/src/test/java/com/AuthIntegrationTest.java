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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
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
        // Очищаємо базу перед кожним тестом для повної ізоляції
        userRepository.deleteAll();
    }

    // ==========================================
    // USER STORY 1: РЕЄСТРАЦІЯ КОРИСТУВАЧА
    // ==========================================

    @Test
    public void testRegister_PositiveScenario() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("positive@learnup.com");
        request.setPassword("pass123");
        request.setFullName("Ivan Ivanov");
        request.setRole(com.learnup.models.Role.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("positive@learnup.com"))
                .andExpect(jsonPath("$.token").exists());

        assertTrue(userRepository.existsByEmail("positive@learnup.com"));
    }

    @Test
    public void testRegister_NegativeScenario_EmailAlreadyExists() throws Exception {
        // Спочатку зберігаємо користувача вручну в базу
        User existingUser = new User();
        existingUser.setEmail("duplicate@learnup.com");
        existingUser.setPassword("encoded_pass");
        existingUser.setFullName("Existing User");
        userRepository.save(existingUser);

        // Намагаємося зареєструвати нового з таким самим Email
        RegisterRequest request = new RegisterRequest();
        request.setEmail("duplicate@learnup.com");
        request.setPassword("newpass123");
        request.setFullName("New User");

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                // Очікуємо статус помилки 400 Bad Request або 500 (залежно від обробки логіки у вашому сервісі)
                .andExpect(status().is4xxClientError());
    }

    // ==========================================
    // USER STORY 2: КЕРУВАННЯ ПРОФІЛЕМ КОРИСТУВАЧА
    // ==========================================

    @Test
    public void testUpdateProfile_PositiveScenario() throws Exception {
        // 1. Створюємо реального користувача в базі
        User user = new User();
        user.setEmail("student@learnup.com");
        user.setFullName("Old Name");
        user.setAvatar("old_avatar.png");
        User savedUser = userRepository.save(user);

        // 2. Готуємо мапу з оновленнями (так, як приймає ваш UserController)
        Map<String, Object> updates = new HashMap<>();
        updates.put("fullName", "New Super Name");
        updates.put("avatar", "new_cool_avatar.png");

        // 3. Робимо реальний PUT-запит на оновлення профілю
        mockMvc.perform(put("/api/users/" + savedUser.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("New Super Name"))
                .andExpect(jsonPath("$.avatar").value("new_cool_avatar.png"));

        // 4. Перевіряємо, чи зміни дійсно фізично записалися в MongoDB
        User updatedUserInDb = userRepository.findById(savedUser.getId()).orElseThrow();
        assertEquals("New Super Name", updatedUserInDb.getFullName());
    }

    @Test
    public void testUpdateProfile_NegativeScenario_UserNotFound() throws Exception {
        Map<String, Object> updates = new HashMap<>();
        updates.put("fullName", "Nobody");

        // Відправляємо запит з неіснуючим ID "fake-id-123"
        mockMvc.perform(put("/api/users/fake-id-123")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                // Контролер при відсутності юзера повертає .notFound().build(), тобто HTTP 404
                .andExpect(status().isNotFound());
    }
}