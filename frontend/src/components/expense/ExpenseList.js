import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";

function ExpenseList({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "6months", label: "Past 6 Months" },
    { value: "all", label: "All Expenses" }
  ];

  const categories = [
    "all", "Food", "Transport", "Utilities", "Entertainment", 
    "Health", "Shopping", "Tax", "Other"
  ];

  const sortOptions = [
    { value: "date-desc", label: "Date (Newest)" },
    { value: "date-asc", label: "Date (Oldest)" },
    { value: "amount-desc", label: "Amount (Highest)" },
    { value: "amount-asc", label: "Amount (Lowest)" },
    { value: "category", label: "Category" },
    { value: "description", label: "Description" }
  ];

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      setError("");
      try {
        let fetchedExpenses;
        if (selectedPeriod === "all") {
          fetchedExpenses = await apiService.getUserExpenses();
        } else {
          fetchedExpenses = await apiService.getUserExpensesByPeriod(selectedPeriod);
        }
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setError("Failed to load expenses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [refreshTrigger, selectedPeriod]);

  // Filter and search expenses
  useEffect(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(expense => parseFloat(expense.amount) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(expense => parseFloat(expense.amount) <= parseFloat(maxAmount));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "amount-desc":
          return parseFloat(b.amount) - parseFloat(a.amount);
        case "amount-asc":
          return parseFloat(a.amount) - parseFloat(b.amount);
        case "category":
          return a.category.localeCompare(b.category);
        case "description":
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory, minAmount, maxAmount, sortBy]);

  const deleteExpense = async (id) => {
    try {
      await apiService.deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError("Failed to delete expense");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date-desc");
  };

  const getTotalFiltered = () => {
    return filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "All Expenses";
  };

  const getUniqueCategories = () => {
    const uniqueCategories = [...new Set(expenses.map(exp => exp.category))];
    return ["all", ...uniqueCategories.sort()];
  };

  if (isLoading) {
    return (
      <div className="expense-list-section">
        <h2 className="expense-list-title">Expense List</h2>
        <div className="no-expenses">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="expense-list-section">
      <div className="expense-list-header">
        <h2 className="expense-list-title">Expense List</h2>
        <div className="period-selector">
          <select
            className="form-input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: "180px" }}
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-filter-section" style={{
        background: 'var(--white)',
        padding: '20px',
        borderRadius: 'var(--border-radius)',
        marginBottom: '20px',
        border: '1px solid var(--gray-200)'
      }}>
        {/* Search Bar */}
        <div className="search-bar" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search expenses by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          />
        </div>

        {/* Filter Controls */}
        <div className="filter-controls" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          >
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>

          {/* Amount Range */}
          <input
            type="number"
            placeholder="Min amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          />
          <input
            type="number"
            placeholder="Max amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          />

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
            style={{ fontSize: '14px' }}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Category Filters */}
        <div className="quick-filters" style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          {categories.slice(1).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`filter-tag ${selectedCategory === category ? 'active' : ''}`}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid var(--gray-300)',
                borderRadius: '20px',
                background: selectedCategory === category ? 'var(--primary-solid)' : 'var(--white)',
                color: selectedCategory === category ? 'white' : 'var(--gray-700)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter Summary and Clear */}
        <div className="filter-summary" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: 'var(--gray-600)'
        }}>
          <div>
            Showing {filteredExpenses.length} of {expenses.length} expenses
            {filteredExpenses.length > 0 && (
              <span style={{ marginLeft: '12px', fontWeight: '600', color: 'var(--primary-solid)' }}>
                Total: ${getTotalFiltered().toFixed(2)}
              </span>
            )}
          </div>
          {(searchTerm || selectedCategory !== "all" || minAmount || maxAmount || sortBy !== "date-desc") && (
            <button
              onClick={clearFilters}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'var(--gray-200)',
                border: '1px solid var(--gray-300)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--gray-700)'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      <div className="period-summary">
        <span className="period-label">Period: {getPeriodLabel()}</span>
        <span className="expense-count">({expenses.length} total expenses)</span>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="no-expenses">
          {expenses.length === 0 
            ? `No expenses found for ${getPeriodLabel().toLowerCase()}.`
            : "No expenses match your current filters."
          }
        </div>
      ) : (
        filteredExpenses.map((expense) => (
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