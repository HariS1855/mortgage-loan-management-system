package com.hari.mortgage.dto.request;

import lombok.Data;

@Data
public class LoanRequest {

    private String loanType;

    private Double loanAmount;

    private Double salary;

    private Integer age;

    private String employmentType;

    private String purpose;

}