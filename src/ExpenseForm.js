import React, { useState } from "react";
import { categorizeExpense } from "./aiService";

function ExpenseForm({ onExpenseAdded, prefillData = {} }) {
  const [description, setDescription] = useState(prefillData.description || "");
const [amount, setAmount] = useState(prefillData.amount || "");
const [date, setDate] = useState(prefillData.date || "");

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [useManualCategory, setUseManualCategory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!description || !amount || !date) {
      setError("Please fill in all fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      let category;

      if (useManualCategory && manualCategory) {
        category = manualCategory;
      } else {
        // Get AI category
        category = await categorizeExpense(description, amount);
      }

      const newExpense = {
        id: Date.now(),
        description: description,
        amount: parseFloat(amount),
        date: new Date(date).toLocaleDateString(),
        category: category,
        createdAt: new Date().toISOString(),
      };
      const key = `expenses_${currentUser.id}`;
      const existingExpenses = JSON.parse(
        localStorage.getItem(key) || "[]"
      );
      const updatedExpenses = [...existingExpenses, newExpense];
      localStorage.setItem(key, JSON.stringify(updatedExpenses));

      console.log("New Expense Added:", newExpense);

      if (onExpenseAdded) {
        onExpenseAdded();
      }

      setDescription("");
      setAmount("");
      setDate("");
      setManualCategory("");
      setUseManualCategory(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      setError(error.message || "Error adding expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-section">
      <h2 className="form-title">Add New Expense</h2>
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            className="form-input"
            type="text"
            placeholder="What did you buy?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="number"
            step="0.01"
            placeholder="How much?"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="add-expense-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Categorizing...
            </>
          ) : (
            "Add Expense"
          )}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
