package com.hari.mortgage.controller;

import com.hari.mortgage.dto.request.PaymentRequest;
import com.hari.mortgage.dto.response.PaymentResponse;
import com.hari.mortgage.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/add")
    public ResponseEntity<PaymentResponse> addPayment(
            @RequestBody PaymentRequest request){

        return ResponseEntity.ok(
                paymentService.addPayment(request));
    }

    @GetMapping("/{loanId}")
    public ResponseEntity<List<PaymentResponse>> getPayments(
            @PathVariable Long loanId){

        return ResponseEntity.ok(
                paymentService.getPayments(loanId));
    }

}
