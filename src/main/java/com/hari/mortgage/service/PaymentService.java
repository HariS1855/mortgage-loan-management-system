package com.hari.mortgage.service;

import com.hari.mortgage.dto.request.PaymentRequest;
import com.hari.mortgage.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    PaymentResponse addPayment(PaymentRequest request);

    List<PaymentResponse> getPayments(Long loanId);

}