package com.xpenseai.budget;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.xpenseai.user.User;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @RequestBody BudgetRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Budget budget = budgetService.createBudget(request, user);
        return ResponseEntity.ok(budget);
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getUserBudgets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Budget> budgets = budgetService.getUserBudgets(user);
        return ResponseEntity.ok(budgets);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        budgetService.deleteBudget(id, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long id,
            @RequestBody BudgetRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Budget budget = budgetService.updateBudget(id, request, user);
        return ResponseEntity.ok(budget);
    }

    @GetMapping("/history")
    public ResponseEntity<List<BudgetHistory>> getBudgetHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<BudgetHistory> history = budgetService.getUserBudgetHistory(user);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/{category}")
    public ResponseEntity<List<BudgetHistory>> getBudgetHistoryByCategory(
            @PathVariable String category,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<BudgetHistory> history = budgetService.getBudgetHistoryByCategory(user, category);
        return ResponseEntity.ok(history);
    }

}