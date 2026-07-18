package com.hari.mortgage.service;

import com.hari.mortgage.dto.request.LoanRequest;
import com.hari.mortgage.dto.response.LoanResponse;

import java.util.List;

public interface LoanService {

    boolean checkEligibility(LoanRequest request);

    LoanResponse applyLoan(LoanRequest request);

    List<LoanResponse> getMyLoans();

    List<LoanResponse> getAllLoans();

    LoanResponse approveLoan(Long id);

    LoanResponse rejectLoan(Long id);

}