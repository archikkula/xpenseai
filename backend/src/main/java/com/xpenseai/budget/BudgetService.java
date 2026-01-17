package com.xpenseai.budget;

import org.springframework.stereotype.Service;
import com.xpenseai.user.User;
import com.xpenseai.expense.ExpenseRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetHistoryRepository budgetHistoryRepository;
    private final ExpenseRepository expenseRepository;

    public Budget createBudget(BudgetRequest request, User user) {
        // Guard: budget per category must be unique for the user
        budgetRepository.findByUserAndCategory(user, request.getCategory())
                .ifPresent(existing -> {
                    throw new RuntimeException("Budget already exists for category: " + request.getCategory());
                });

        // Sanitize incoming values (avoid nulls)
        String periodType = request.getPeriodType() != null ? request.getPeriodType() : "MONTHLY";
        Boolean autoReset = request.getAutoReset() != null ? request.getAutoReset() : Boolean.TRUE;

        Budget budget = Budget.builder()
                .category(request.getCategory())
                .amount(request.getAmount())
                .periodType(periodType)
                .autoReset(autoReset)
                .user(user)
                .build();

        // Ensure dates are initialized
        budget.calculateNextResetDate();

        return budgetRepository.save(budget);
    }

    public List<Budget> getUserBudgets(User user) {
        List<Budget> budgets = budgetRepository.findByUser(user);

        // Normalize legacy/dirty rows to prevent NPEs later
        for (Budget b : budgets) {
            boolean changed = false;

            if (b.getAutoReset() == null) {
                b.setAutoReset(Boolean.TRUE); // choose your default
                changed = true;
            }
            if (b.getPeriodType() == null || b.getPeriodType().isBlank()) {
                b.setPeriodType("MONTHLY");
                changed = true;
            }
            if (b.getCurrentPeriodStart() == null) {
                b.setCurrentPeriodStart(LocalDate.now());
                changed = true;
            }
            if (b.getNextResetDate() == null) {
                b.calculateNextResetDate();
                changed = true;
            }
            if (changed) {
                budgetRepository.save(b);
            }
        }

        // Check if any budgets need to be reset (null-safe inside)
        budgets.forEach(this::checkAndResetBudget);

        return budgets;
    }

    public void deleteBudget(Long budgetId, User user) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this budget");
        }

        budgetRepository.delete(budget);
    }

    public Budget updateBudget(Long budgetId, BudgetRequest request, User user) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to update this budget");
        }

        // Apply updates with null-safe defaults
        if (request.getAmount() != null) {
            budget.setAmount(request.getAmount());
        }
        if (request.getPeriodType() != null) {
            budget.setPeriodType(request.getPeriodType());
        }
        if (request.getAutoReset() != null) {
            budget.setAutoReset(request.getAutoReset());
        } else if (budget.getAutoReset() == null) {
            budget.setAutoReset(Boolean.TRUE);
        }

        // Ensure dates are consistent if the period changed or were missing
        if (budget.getCurrentPeriodStart() == null) {
            budget.setCurrentPeriodStart(LocalDate.now());
        }
        if (budget.getNextResetDate() == null) {
            budget.calculateNextResetDate();
        } else {
            // Recalculate on update to keep schedule aligned with new period type
            budget.calculateNextResetDate();
        }

        return budgetRepository.save(budget);
    }

    private void checkAndResetBudget(Budget budget) {
        LocalDate today = LocalDate.now();

        // Null-safe autoReset check (prevents NPE from Boolean unboxing)
        if (Boolean.TRUE.equals(budget.getAutoReset())
                && budget.getNextResetDate() != null
                && !today.isBefore(budget.getNextResetDate())) {

            // Calculate spent amount for the period
            Double spentAmount = calculateSpentAmountForPeriod(budget);

            // Create history record
            BudgetHistory history = BudgetHistory.builder()
                    .category(budget.getCategory())
                    .budgetAmount(budget.getAmount())
                    .spentAmount(spentAmount)
                    .periodStart(budget.getCurrentPeriodStart())
                    .periodEnd(budget.getNextResetDate().minusDays(1))
                    .periodType(budget.getPeriodType())
                    .user(budget.getUser())
                    .budget(budget)
                    .build();

            budgetHistoryRepository.save(history);

            // Reset the budget period
            budget.setCurrentPeriodStart(today);
            budget.calculateNextResetDate();
            budgetRepository.save(budget);
        }
    }

    private Double calculateSpentAmountForPeriod(Budget budget) {
        LocalDate startDate = budget.getCurrentPeriodStart();
        LocalDate endDate = budget.getNextResetDate().minusDays(1);

        return expenseRepository.findByUserAndDateBetweenOrderByDateDesc(
                budget.getUser(), startDate, endDate)
                .stream()
                .filter(expense -> expense.getCategory().equals(budget.getCategory()))
                .mapToDouble(expense -> expense.getAmount())
                .sum();
    }

    public List<BudgetHistory> getUserBudgetHistory(User user) {
        return budgetHistoryRepository.findByUserOrderByPeriodStartDesc(user);
    }

    public List<BudgetHistory> getBudgetHistoryByCategory(User user, String category) {
        return budgetHistoryRepository.findByUserAndCategoryOrderByPeriodStartDesc(user, category);
    }
    
}
