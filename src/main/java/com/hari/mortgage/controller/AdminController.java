package com.hari.mortgage.controller;

import com.hari.mortgage.dto.response.LoanResponse;
import com.hari.mortgage.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LoanService loanService;

    @GetMapping("/loans")
    public ResponseEntity<List<LoanResponse>> getAllLoans() {

        return ResponseEntity.ok(
                loanService.getAllLoans()
        );
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<LoanResponse> approveLoan(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.approveLoan(id)
        );
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<LoanResponse> rejectLoan(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.rejectLoan(id)
        );
    }

}