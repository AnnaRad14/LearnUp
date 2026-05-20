package com;

import com.learnup.controllers.AuthController;
import com.learnup.dto.AuthResponse;
import com.learnup.dto.RegisterRequest;
import com.learnup.services.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService; // Фейковий сервіс авторизації

    @InjectMocks
    private AuthController authController; // Реальний контролер, куди підставиться наш фейк

    @Test
    public void testRegisterEndpoint_Success() {
        // 1. Готуємо вхідні дані (запит від "фронтенду")
        RegisterRequest request = new RegisterRequest();
        request.setEmail("controller@test.com");
        request.setPassword("pass123");
        request.setFullName("Controller User");

        // 2. Готуємо фейкову відповідь, яку нібито поверне AuthService
        AuthResponse mockResponse = new AuthResponse(
                "fake-jwt-token-for-controller",
                "user-id-777",
                "controller@test.com",
                "Controller User",
                "STUDENT",
                Collections.emptyList(),
                Collections.emptyList()
        );

        // Навчаємо Mock: коли контролер викличе authService.register, повертаємо mockResponse
        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // 3. Викликаємо реальний метод контролера (перевір, чи він у тебе називається register)
        ResponseEntity<AuthResponse> responseEntity = authController.register(request);

        // 4. Перевіряємо результат
        assertNotNull(responseEntity);
        assertEquals(200, responseEntity.getStatusCode().value()); // Перевіряємо HTTP статус 200 OK

        AuthResponse body = responseEntity.getBody();
        assertNotNull(body);
        assertEquals("fake-jwt-token-for-controller", body.getToken());
        assertEquals("controller@test.com", body.getEmail());

        // Перевіряємо, що контролер дійсно передав роботу сервісу 1 раз
        verify(authService, times(1)).register(request);
    }
}