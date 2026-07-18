package com.hari.mortgage.dto.request;

import lombok.Data;

@Data
public class PaymentRequest {

    private Long loanId;

    private Double amount;

}