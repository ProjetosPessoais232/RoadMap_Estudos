package com.roadmap.estudos.service;

import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.dto.AuthRequest;
import com.roadmap.estudos.dto.AuthResponse;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.UserAccountRepository;
import com.roadmap.estudos.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail");
        }
        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccountRepository.save(user);
        return new AuthResponse(jwtService.generate(email), email);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String email = request.email().trim().toLowerCase();
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }
        return new AuthResponse(jwtService.generate(email), email);
    }
}
