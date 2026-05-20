package com.learnup.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    // Створюємо безпечний ключ із текстового рядка довжиною не менше 32 символів
    private final String SECRET_KEY = "mySuperSecretKeyForLearnUpProject2026!!!";
    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    // Токен дійсний 24 години
    private final long jwtExpiration = 86400000;

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}