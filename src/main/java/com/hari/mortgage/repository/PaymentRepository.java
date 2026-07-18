package com.hari.mortgage.repository;

import com.hari.mortgage.entity.LoanApplication;
import com.hari.mortgage.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByLoan(LoanApplication loan);

}
