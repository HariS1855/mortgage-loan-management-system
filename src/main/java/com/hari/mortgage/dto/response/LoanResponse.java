package com.hari.mortgage.dto.response;

import com.hari.mortgage.enums.LoanStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoanResponse {

    private Long id;

    private String loanType;

    private Double loanAmount;

    private Boolean eligible;

    private LoanStatus status;

}
