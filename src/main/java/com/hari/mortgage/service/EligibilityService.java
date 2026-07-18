package com.hari.mortgage.service;

public interface EligibilityService {

    boolean isEligible(int age,
                       double salary,
                       double loanAmount);

}