package com.xpenseai.budget;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BudgetRequest {
    private String category;
    private Double amount;
    @Builder.Default
    private String periodType = "MONTHLY"; // "MONTHLY", "WEEKLY", "YEARLY", "CUSTOM"
    @Builder.Default
    private Boolean autoReset = true;
}