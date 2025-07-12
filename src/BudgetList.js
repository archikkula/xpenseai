import React, { useEffect, useState } from "react";

function BudgetList({ refreshTrigger }) {
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      const storedBudgets = JSON.parse(
        localStorage.getItem(`budgets_${currentUser.id}`) || "[]"
      );
      setBudgets(storedBudgets);
    }
  }, [refreshTrigger]);

  function deleteBudget(budgetId) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const key = `budgets_${currentUser?.id}`;
    const updated = budgets.filter((b) => b.id !== budgetId);
    localStorage.setItem(key, JSON.stringify(updated));
    setBudgets(updated);
  }

  return (
    <div className="expense-list-section">
      <h2 className="expense-list-title">Your Budgets</h2>
      {budgets.length === 0 ? (
        <p className="no-expenses">No budgets set yet.</p>
      ) : (
        budgets.map((budget) => (
          <div className="expense-card" key={budget.id}>
            <div className="expense-item">
              <span className="expense-description">{budget.category}</span>
              <span className="expense-amount">${budget.amount}</span>
            </div>
            <button
              onClick={() => deleteBudget(budget.id)}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default BudgetList;
