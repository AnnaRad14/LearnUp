package com.learnup.dto;

import com.learnup.models.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private Role role; // Студент чи Викладач
}