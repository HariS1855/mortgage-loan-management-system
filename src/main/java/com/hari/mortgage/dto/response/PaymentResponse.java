package com.hari.mortgage.dto.response;

import com.hari.mortgage.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PaymentResponse {

    private Long id;

    private Double amount;

    private LocalDate paymentDate;

    private PaymentStatus status;

}
