package com.hari.mortgage.entity;

import com.hari.mortgage.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "loan_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String loanType;

    private Double loanAmount;

    private Double salary;

    private Integer age;

    private String employmentType;

    private String purpose;

    private Boolean eligible;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;

    private LocalDate applicationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

}