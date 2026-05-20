package com;

import com.learnup.dto.AuthResponse;
import com.learnup.dto.RegisterRequest;
import com.learnup.models.Role;
import com.learnup.models.User;
import com.learnup.repositories.UserRepository;
import com.learnup.services.AuthService;
import com.learnup.services.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    public void testRegister_Success() {
        // 1. Готуємо вхідні дані для тесту
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@learnup.com");
        request.setPassword("plainPassword");
        request.setFullName("Test User");
        request.setRole(Role.STUDENT);

        // 2. Навчаємо Mock-об'єкти
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword123");
        when(jwtService.generateToken(anyString())).thenReturn("mocked-jwt-token");

        // Імітуємо, що в базі вже є користувачі, щоб спрацювала гілка else
        when(userRepository.count()).thenReturn(5L);

        // 3. Викликаємо метод сервісу
        AuthResponse response = authService.register(request);

        // 4. Перевіряємо результат (без перевірки getId(), бо сервіс повертає null)
        assertNotNull(response);
        assertEquals("test@learnup.com", response.getEmail());
        assertEquals("mocked-jwt-token", response.getToken());
        assertEquals("STUDENT", response.getRole());

        // Перевіряємо, що метод save взагалі викликався 1 раз
        verify(userRepository, times(1)).save(any(User.class));
    }
}