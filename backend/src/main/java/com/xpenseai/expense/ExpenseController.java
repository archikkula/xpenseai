package com.xpenseai.expense;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.xpenseai.user.User;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @RequestBody ExpenseRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Expense expense = expenseService.createExpense(request, user);
        return ResponseEntity.ok(expense);
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getUserExpenses(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Authentication authentication) {

        System.out.println("🔵 getUserExpenses called with period: " + period);
        System.out.println("🔵 startDate: " + startDate + ", endDate: " + endDate);

        User user = (User) authentication.getPrincipal();
        System.out.println("🔵 User: " + user.getEmail());

        try {
            if (period != null) {
                List<Expense> expenses = expenseService.getUserExpensesByPeriod(user, period);
                System.out.println("✅ Found " + expenses.size() + " expenses for period " + period);
                return ResponseEntity.ok(expenses);
            } else if (startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                List<Expense> expenses = expenseService.getUserExpensesByDateRange(user, start, end);
                System.out.println("✅ Found " + expenses.size() + " expenses for date range");
                return ResponseEntity.ok(expenses);
            } else {
                List<Expense> expenses = expenseService.getUserExpenses(user);
                System.out.println("✅ Found " + expenses.size() + " total expenses");
                return ResponseEntity.ok(expenses);
            }
        } catch (Exception e) {
            System.err.println("❌ Error in getUserExpenses: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        expenseService.deleteExpense(id, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/categories/{category}")
    public ResponseEntity<List<Expense>> getExpensesByCategory(
            @PathVariable String category,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Expense> expenses = expenseService.getExpensesByCategory(category, user);
        return ResponseEntity.ok(expenses);
    }
    
    @GetMapping("/debug")
public ResponseEntity<Map<String, Object>> debugExpenses(Authentication authentication) {
    User user = (User) authentication.getPrincipal();
    List<Expense> expenses = expenseService.getUserExpenses(user);
    
    Map<String, Object> debug = new HashMap<>();
    debug.put("totalExpenses", expenses.size());
    debug.put("expenses", expenses.stream().limit(5).map(e -> {
        Map<String, Object> exp = new HashMap<>();
        exp.put("id", e.getId());
        exp.put("description", e.getDescription());
        exp.put("amount", e.getAmount());
        exp.put("date", e.getDate().toString());
        exp.put("createdAt", e.getCreatedAt().toString());
        return exp;
    }).collect(Collectors.toList()));
    
    return ResponseEntity.ok(debug);
}
}