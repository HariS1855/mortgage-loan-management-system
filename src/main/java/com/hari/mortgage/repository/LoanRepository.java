package com.hari.mortgage.repository;

import com.hari.mortgage.entity.LoanApplication;
import com.hari.mortgage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {

    List<LoanApplication> findByUser(User user);

}