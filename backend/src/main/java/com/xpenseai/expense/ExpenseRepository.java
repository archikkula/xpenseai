package com.xpenseai.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.xpenseai.user.User;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e WHERE e.user = ?1 ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByUserOrderByDateDesc(User user);

    @Query("SELECT e FROM Expense e WHERE e.user = ?1 AND e.category = ?2 ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByUserAndCategoryOrderByDateDesc(User user, String category);

    @Query("SELECT e FROM Expense e WHERE e.user = ?1 AND e.date BETWEEN ?2 AND ?3 ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);

    @Query("SELECT e FROM Expense e WHERE e.user = ?1 AND e.date = ?2 ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByUserAndDateOrderByDateDesc(User user, LocalDate date);
}