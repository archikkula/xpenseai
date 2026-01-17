import React, { useState } from 'react';
import apiService from '../../services/apiService';

function BudgetForm({ onBudgetAdded }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [autoReset, setAutoReset] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category || !amount) {
      setError('Please fill in all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.createBudget({
        category: category,
        amount: parseFloat(amount),
        periodType: periodType,
        autoReset: autoReset
      });

      setCategory('');
      setAmount('');
      setPeriodType('MONTHLY');
      setAutoReset(true);

      if (onBudgetAdded) {
        onBudgetAdded();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      setError(error.message || 'Error creating budget. Please try again.');
    } finally {
      setIsLoading(false);
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

  const periodOptions = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  return (
    <div className="form-section">
      <h2 className="form-title">Set Budget</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
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
            placeholder="Budget Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <select
            className="form-input"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            disabled={isLoading}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoReset}
              onChange={(e) => setAutoReset(e.target.checked)}
              disabled={isLoading}
            />
            Auto-reset budget when period ends
          </label>
        </div>
        <button type="submit" className="add-expense-btn" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Budget'}
        </button>
      </form>
    </div>
  );
}

export default BudgetForm;