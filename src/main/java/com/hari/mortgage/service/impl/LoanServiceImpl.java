package com.hari.mortgage.service.impl;

import com.hari.mortgage.dto.request.LoanRequest;
import com.hari.mortgage.dto.response.LoanResponse;
import com.hari.mortgage.entity.LoanApplication;
import com.hari.mortgage.entity.User;
import com.hari.mortgage.enums.LoanStatus;
import com.hari.mortgage.repository.LoanRepository;
import com.hari.mortgage.repository.UserRepository;
import com.hari.mortgage.service.EligibilityService;
import com.hari.mortgage.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final EligibilityService eligibilityService;

    @Override
    public boolean checkEligibility(LoanRequest request) {

        return eligibilityService.isEligible(
                request.getAge(),
                request.getSalary(),
                request.getLoanAmount()
        );
    }

    @Override
    public LoanResponse applyLoan(LoanRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow();

        boolean eligible = eligibilityService.isEligible(
                request.getAge(),
                request.getSalary(),
                request.getLoanAmount()
        );

        LoanApplication loan = LoanApplication.builder()
                .loanType(request.getLoanType())
                .loanAmount(request.getLoanAmount())
                .salary(request.getSalary())
                .age(request.getAge())
                .employmentType(request.getEmploymentType())
                .purpose(request.getPurpose())
                .eligible(eligible)
                .status(LoanStatus.PENDING)
                .applicationDate(LocalDate.now())
                .user(user)
                .build();

        LoanApplication savedLoan = loanRepository.save(loan);

        return LoanResponse.builder()
                .id(savedLoan.getId())
                .loanType(savedLoan.getLoanType())
                .loanAmount(savedLoan.getLoanAmount())
                .eligible(savedLoan.getEligible())
                .status(savedLoan.getStatus())
                .build();
    }

    @Override
    public List<LoanResponse> getMyLoans() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow();

        return loanRepository.findByUser(user)
                .stream()
                .map(loan -> LoanResponse.builder()
                        .id(loan.getId())
                        .loanType(loan.getLoanType())
                        .loanAmount(loan.getLoanAmount())
                        .eligible(loan.getEligible())
                        .status(loan.getStatus())
                        .build())
                .toList();
    }
    @Override
    public List<LoanResponse> getAllLoans() {

        return loanRepository.findAll()
                .stream()
                .map(loan -> LoanResponse.builder()
                        .id(loan.getId())
                        .loanType(loan.getLoanType())
                        .loanAmount(loan.getLoanAmount())
                        .eligible(loan.getEligible())
                        .status(loan.getStatus())
                        .build())
                .toList();
    }

    @Override
    public LoanResponse approveLoan(Long id) {

        LoanApplication loan = loanRepository.findById(id)
                .orElseThrow();

        loan.setStatus(LoanStatus.APPROVED);

        loanRepository.save(loan);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .loanAmount(loan.getLoanAmount())
                .eligible(loan.getEligible())
                .status(loan.getStatus())
                .build();
    }

    @Override
    public LoanResponse rejectLoan(Long id) {

        LoanApplication loan = loanRepository.findById(id)
                .orElseThrow();

        loan.setStatus(LoanStatus.REJECTED);

        loanRepository.save(loan);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .loanAmount(loan.getLoanAmount())
                .eligible(loan.getEligible())
                .status(loan.getStatus())
                .build();
    }
}