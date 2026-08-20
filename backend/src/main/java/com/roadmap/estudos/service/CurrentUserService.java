package com.roadmap.estudos.service;

import com.roadmap.estudos.domain.UserAccount;
import com.roadmap.estudos.exception.ApiException;
import com.roadmap.estudos.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserAccountRepository userAccountRepository;

    public CurrentUserService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para continuar");
        }
        return userAccountRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para continuar"));
    }
}
