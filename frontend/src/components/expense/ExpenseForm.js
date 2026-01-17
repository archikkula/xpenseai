import React, { useState } from "react";
import { categorizeExpense } from "../../services/aiService";
import apiService from "../../services/apiService";

function ExpenseForm({ onExpenseAdded, prefillData = {}, isFromScan = false, onScanItemRemoved }) {
  const [description, setDescription] = useState(prefillData.description || "");
  const [amount, setAmount] = useState(prefillData.amount || "");
  const [date, setDate] = useState(prefillData.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(prefillData.category || "");

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
      let finalCategory;

      if (useManualCategory && manualCategory) {
        finalCategory = manualCategory;
      } else if (category) {
        // Use prefilled category from scan
        finalCategory = category;
      } else {
        // Get AI category for manual entries
        finalCategory = await categorizeExpense(description, amount);
      }

      // Use the API service and make sure date is in YYYY-MM-DD format
      await apiService.createExpense({
        description: description,
        amount: parseFloat(amount),
        date: date,
        category: finalCategory,
      });

      console.log("Expense added successfully via API");

      if (onExpenseAdded) {
        onExpenseAdded();
      }

      // If this is from a scan, notify parent to remove the card
      if (isFromScan && onScanItemRemoved) {
        onScanItemRemoved();
      }

      // Reset form only if not from scan (to prevent clearing other scan items)
      if (!isFromScan) {
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split('T')[0]);
        setCategory("");
        setManualCategory("");
        setUseManualCategory(false);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      setError(error.message || "Error adding expense. Please try again.");
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
    'Tax',
    'Other'
  ];

  return (
    <div className={`form-section ${isFromScan ? 'scan-form' : ''}`}>
      {!isFromScan && <h2 className="form-title">Add New Expense</h2>}
      
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

        {/* Category selection */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <label style={{ fontSize: '14px', color: '#666' }}>
              <input
                type="checkbox"
                checked={useManualCategory}
                onChange={(e) => setUseManualCategory(e.target.checked)}
                disabled={isLoading}
              />
              {' '}Manually select category
            </label>
          </div>
          
          {useManualCategory && (
            <select
              className="form-input"
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          
          {!useManualCategory && category && (
            <div style={{ 
              fontSize: '12px', 
              color: '#4CAF50', 
              padding: '4px 8px',
              backgroundColor: '#f1f8e9',
              borderRadius: '4px',
              border: '1px solid #c8e6c9'
            }}>
              Will use category: <strong>{category}</strong>
            </div>
          )}
        </div>

        <div style={isFromScan ? { display: 'flex', gap: '8px', alignItems: 'stretch' } : {}}>
          <button 
            type="submit" 
            className="add-expense-btn" 
            disabled={isLoading}
            style={isFromScan ? { 
              backgroundColor: 'var(--primary-solid)',
              background: 'var(--primary)',
              fontSize: '14px',
              padding: '14px 24px',
              flex: '1',
              margin: '0'
            } : {}}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {isFromScan ? 'Adding...' : 'Categorizing...'}
              </>
            ) : (
              isFromScan ? 'Add This Item' : 'Add Expense'
            )}
          </button>
          
          {isFromScan && (
            <button 
              type="button"
              onClick={onScanItemRemoved}
              className="btn btn-secondary"
              style={{ 
                fontSize: '14px',
                padding: '14px 24px',
                backgroundColor: 'var(--gray-200)',
                color: 'var(--gray-700)',
                border: '2px solid var(--gray-300)',
                borderRadius: 'var(--border-radius)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'var(--transition)',
                cursor: 'pointer',
                flex: '0 0 auto',
                minWidth: '100px'
              }}
              disabled={isLoading}
            >
              Skip
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;