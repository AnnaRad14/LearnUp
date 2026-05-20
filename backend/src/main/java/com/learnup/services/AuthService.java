package com.learnup.services;

import com.learnup.dto.AuthResponse;
import com.learnup.dto.LoginRequest;
import com.learnup.dto.RegisterRequest;
import com.learnup.models.Role;
import com.learnup.models.User;
import com.learnup.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email вже зайнятий!");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());

        // 🔥 НАША СЕКРЕТНА ПЕРЕВІРКА:
        // Якщо база порожня — це ти, робимо тебе ADMIN (використовуємо твій Enum ролей).
        // Якщо в базі вже хтось є — беремо ту роль, яку надіслав фронтенд (STUDENT або TEACHER).
        if (userRepository.count() == 0) {
            user.setRole(Role.ADMIN); // Перевір, чи твій Enum називається Role.ADMIN чи UserRole.ADMIN
        } else {
            user.setRole(request.getRole());
        }

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(), // Тут успішно повернеться "ADMIN", "TEACHER" або "STUDENT"
                user.getUnlockedCourseIds(),
                user.getCompletedLessonIds()
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Невірний пароль!");
        }

        String token = jwtService.generateToken(user.getEmail());
        // 🔥 Передаємо завантажені з бази списки курсів та уроків користувача
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getUnlockedCourseIds(),
                user.getCompletedLessonIds()
        );
    }
}