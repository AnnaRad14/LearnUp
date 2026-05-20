package com;

import com.learnup.controllers.UserController;
import com.learnup.models.User;
import com.learnup.models.Role;
import com.learnup.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserController userController;

    @Test
    public void testGetUserById_Success() {
        String userId = "user-123";

        // 1. Готуємо фейкового користувача
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail("profile@test.com");
        mockUser.setFullName("Ivan Ivanov");
        mockUser.setRole(Role.STUDENT);

        // 2. Навчаємо Mock повертати користувача при пошуку за ID
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        // 3. Викликаємо метод контролера (тут змінено тип на ResponseEntity<?>)
        ResponseEntity<?> responseEntity = userController.getUserById(userId);

        // 4. Перевіряємо результат
        assertNotNull(responseEntity);
        assertEquals(200, responseEntity.getStatusCode().value()); // HTTP 200 OK

        // Оскільки тип відповіді <?> (невідомий), ми примусово приводимо його до класу User для перевірки полів
        User body = (User) responseEntity.getBody();
        assertNotNull(body);
        assertEquals("profile@test.com", body.getEmail());
        assertEquals("Ivan Ivanov", body.getFullName());

        // Перевіряємо, що запит до репозиторію пройшов рівно 1 раз
        verify(userRepository, times(1)).findById(userId);
    }
}