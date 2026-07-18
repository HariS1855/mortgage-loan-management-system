package com.hari.mortgage.controller;

import com.hari.mortgage.dto.request.LoanRequest;
import com.hari.mortgage.dto.response.LoanResponse;
import com.hari.mortgage.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/check")
    public ResponseEntity<Boolean> checkEligibility(
            @RequestBody LoanRequest request) {

        return ResponseEntity.ok(
                loanService.checkEligibility(request)
        );
    }

    @PostMapping("/apply")
    public ResponseEntity<LoanResponse> applyLoan(
            @RequestBody LoanRequest request) {

        return ResponseEntity.ok(
                loanService.applyLoan(request)
        );
    }

    @GetMapping("/my-loans")
    public ResponseEntity<List<LoanResponse>> getMyLoans() {

        return ResponseEntity.ok(
                loanService.getMyLoans()
        );
    }
}