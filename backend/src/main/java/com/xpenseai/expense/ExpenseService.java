package com.xpenseai.expense;

import org.springframework.stereotype.Service;
import com.xpenseai.user.User;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public Expense createExpense(ExpenseRequest request, User user) {
        LocalDate expenseDate;

        try {
            // Try to parse the date string as LocalDate (YYYY-MM-DD format)
            expenseDate = LocalDate.parse(request.getDate());
        } catch (DateTimeParseException e) {
            // If parsing fails, try with different format or use current date
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                expenseDate = LocalDate.parse(request.getDate(), formatter);
            } catch (DateTimeParseException ex) {
                // If all parsing fails, use current date as fallback
                expenseDate = LocalDate.now();
            }
        }

        Expense expense = Expense.builder()
                .description(request.getDescription())
                .amount(request.getAmount())
                .date(expenseDate) // Use the parsed date, not current date
                .category(request.getCategory())
                .user(user)
                .build();

        return expenseRepository.save(expense);
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUserOrderByDateDesc(user);
    }

    public List<Expense> getUserExpensesByPeriod(User user, String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;

        switch (period.toLowerCase()) {
            case "today":
                startDate = endDate;
                break;
            case "week":
                startDate = endDate.minusWeeks(1);
                break;
            case "month":
                startDate = endDate.minusMonths(1);
                break;
            case "6months":
                startDate = endDate.minusMonths(6);
                break;
            case "all":
            default:
                return getUserExpenses(user);
        }

        return expenseRepository.findByUserAndDateBetweenOrderByDateDesc(user, startDate, endDate);
    }

    public List<Expense> getUserExpensesByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserAndDateBetweenOrderByDateDesc(user, startDate, endDate);
    }

    public void deleteExpense(Long expenseId, User user) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this expense");
        }

        expenseRepository.delete(expense);
    }

    public List<Expense> getExpensesByCategory(String category, User user) {
        return expenseRepository.findByUserAndCategoryOrderByDateDesc(user, category);
    }
}