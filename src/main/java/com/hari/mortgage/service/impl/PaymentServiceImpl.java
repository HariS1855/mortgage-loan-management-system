package com.hari.mortgage.service.impl;

import com.hari.mortgage.dto.request.PaymentRequest;
import com.hari.mortgage.dto.response.PaymentResponse;
import com.hari.mortgage.entity.LoanApplication;
import com.hari.mortgage.entity.Payment;
import com.hari.mortgage.enums.PaymentStatus;
import com.hari.mortgage.repository.LoanRepository;
import com.hari.mortgage.repository.PaymentRepository;
import com.hari.mortgage.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final LoanRepository loanRepository;

    @Override
    public PaymentResponse addPayment(PaymentRequest request) {

        LoanApplication loan = loanRepository.findById(request.getLoanId())
                .orElseThrow();

        Payment payment = Payment.builder()
                .loan(loan)
                .amount(request.getAmount())
                .paymentDate(LocalDate.now())
                .status(PaymentStatus.PAID)
                .build();

        Payment saved = paymentRepository.save(payment);

        return PaymentResponse.builder()
                .id(saved.getId())
                .amount(saved.getAmount())
                .paymentDate(saved.getPaymentDate())
                .status(saved.getStatus())
                .build();
    }

    @Override
    public List<PaymentResponse> getPayments(Long loanId) {

        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow();

        return paymentRepository.findByLoan(loan)
                .stream()
                .map(payment -> PaymentResponse.builder()
                        .id(payment.getId())
                        .amount(payment.getAmount())
                        .paymentDate(payment.getPaymentDate())
                        .status(payment.getStatus())
                        .build())
                .toList();
    }
}