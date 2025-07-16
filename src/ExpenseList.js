import React, { useEffect, useState } from "react";

function ExpenseList({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      const stored = JSON.parse(
        localStorage.getItem(`expenses_${currentUser.id}`) || "[]"
      );
      setExpenses(stored);
    }
  }, [refreshTrigger]);

  const deleteExpense = (id) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const key = `expenses_${currentUser?.id}`;
    const updated = expenses.filter((e) => e.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setExpenses(updated);
  };

  return (
    <div className="expense-list-section">
      <h2 className="expense-list-title">Expense List</h2>
      {expenses.length === 0 ? (
        <div className="no-expenses">No expenses recorded yet.</div>
      ) : (
        expenses.map((expense) => (
          <div className="expense-card" key={expense.id} style={{ position: "relative" }}>
            <div className="expense-item">
              <span className="expense-description">{expense.description}</span>
              <span className="expense-amount">${expense.amount}</span>
            </div>
            <div className="expense-meta">
              <span className="expense-category">{expense.category}</span>
              <span className="expense-date">Date: {expense.date}</span>
            </div>
            <button className="delete-btn" onClick={() => deleteExpense(expense.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default ExpenseList;
