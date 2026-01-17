package com.xpenseai.budget;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.xpenseai.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "period_type")
    @Builder.Default
    private String periodType = "MONTHLY"; // "MONTHLY", "WEEKLY", "YEARLY", "CUSTOM"

    @Column(name = "current_period_start")
    private LocalDate currentPeriodStart;

    @Column(name = "next_reset_date")
    private LocalDate nextResetDate;

    @Column(name = "auto_reset")
    @Builder.Default
    private Boolean autoReset = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (currentPeriodStart == null) {
            currentPeriodStart = LocalDate.now();
        }
        if (nextResetDate == null) {
            calculateNextResetDate();
        }
    }

    public void calculateNextResetDate() {
        if (currentPeriodStart == null) {
            currentPeriodStart = LocalDate.now();
        }

        switch (periodType) {
            case "WEEKLY":
                nextResetDate = currentPeriodStart.plusWeeks(1);
                break;
            case "YEARLY":
                nextResetDate = currentPeriodStart.plusYears(1);
                break;
            case "MONTHLY":
            default:
                nextResetDate = currentPeriodStart.plusMonths(1);
                break;
        }
    }
}