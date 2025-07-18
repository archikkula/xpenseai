import React, { useState } from 'react';

function BudgetForm({ onBudgetAdded }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const key = `budgets_${currentUser.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [...existing, { category, amount: parseFloat(amount), id: Date.now() }];

    localStorage.setItem(key, JSON.stringify(updated));
    setCategory('');
    setAmount('');

    if (onBudgetAdded) {
      onBudgetAdded();
    }
  };

  const categories = [
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Health',
    'Shopping',
    'Other'
  ];

  return (
    <div className="form-section">
      <h2 className="form-title">Set Monthly Budgets</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button type="submit" className="add-expense-btn">Save Budget</button>
      </form>
    </div>
  );
}

export default BudgetForm;
