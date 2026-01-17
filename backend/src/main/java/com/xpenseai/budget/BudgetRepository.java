package com.xpenseai.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import com.xpenseai.user.User;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser(User user);

    Optional<Budget> findByUserAndCategory(User user, String category);
}