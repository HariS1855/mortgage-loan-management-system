package com.hari.mortgage.service.impl;

import com.hari.mortgage.service.EligibilityService;
import org.springframework.stereotype.Service;

@Service
public class EligibilityServiceImpl implements EligibilityService {

    @Override
    public boolean isEligible(int age,
                              double salary,
                              double loanAmount) {

        if(age < 21)
            return false;

        if(salary < 25000)
            return false;

        return loanAmount <= salary * 20;
    }
}
