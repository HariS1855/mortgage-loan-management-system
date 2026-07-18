package com.hari.mortgage.service;

import com.hari.mortgage.dto.request.LoginRequest;
import com.hari.mortgage.dto.request.RegisterRequest;
import com.hari.mortgage.dto.response.LoginResponse;

public interface UserService {

    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

}