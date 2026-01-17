package com.xpenseai.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import com.xpenseai.user.User;
import java.time.LocalDate;
import java.util.List;

public interface BudgetHistoryRepository extends JpaRepository<BudgetHistory, Long> {
    List<BudgetHistory> findByUserOrderByPeriodStartDesc(User user);

    List<BudgetHistory> findByUserAndCategoryOrderByPeriodStartDesc(User user, String category);

    List<BudgetHistory> findByUserAndPeriodStartBetweenOrderByPeriodStartDesc(User user, LocalDate startDate,
            LocalDate endDate);

            
}