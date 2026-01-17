import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";

function BudgetList({ refreshTrigger }) {
  const [budgets, setBudgets] = useState([]);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("current"); // "current" or "history"

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        if (activeTab === "current") {
          const fetchedBudgets = await apiService.getUserBudgets();
          setBudgets(fetchedBudgets);
        } else {
          const fetchedHistory = await apiService.getBudgetHistory();
          setBudgetHistory(fetchedHistory);
        }
      } catch (error) {
        console.error("Error fetching budget data:", error);
        setError("Failed to load budget data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger, activeTab]);

  const deleteBudget = async (budgetId) => {
    try {
      await apiService.deleteBudget(budgetId);
      setBudgets(budgets.filter((b) => b.id !== budgetId));
    } catch (error) {
      console.error("Error deleting budget:", error);
      setError("Failed to delete budget");
    }
  };

  const formatPeriodType = (periodType) => {
    if (!periodType || typeof periodType !== 'string') {
      return 'Monthly'; // Default fallback
    }
    return periodType.charAt(0) + periodType.slice(1).toLowerCase();
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return 'Invalid date range';
    return `${start} to ${end}`;
  };

  const calculateProgress = (spent, budget) => {
    if (!spent || !budget || budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="expense-list-section">
        <h2 className="expense-list-title">Your Budgets</h2>
        <div className="no-expenses">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="expense-list-section">
      <div className="budget-header">
        <h2 className="expense-list-title">Your Budgets</h2>
        <div className="budget-tabs">
          <button
            className={`tab-btn ${activeTab === "current" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            Current Budgets
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Budget History
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {activeTab === "current" ? (
        // Current Budgets View
        <>
          {budgets.length === 0 ? (
            <div className="no-expenses">No budgets set yet.</div>
          ) : (
            budgets.map((budget) => (
              <div className="budget-card" key={budget.id}>
                <div className="budget-header-info">
                  <div className="budget-category">{budget.category || 'Unknown'}</div>
                  <div className="budget-period">{formatPeriodType(budget.periodType)}</div>
                </div>
                
                <div className="budget-amount-info">
                  <div className="budget-amount">${budget.amount || 0}</div>
                  <div className="budget-dates">
                    Period: {budget.currentPeriodStart || 'Not set'} - {budget.nextResetDate || 'Not set'}
                  </div>
                </div>

                <div className="budget-actions">
                  <span className="auto-reset-status">
                    {budget.autoReset ? "Auto-reset: On" : "Auto-reset: Off"}
                  </span>
                  <button className="delete-btn" onClick={() => deleteBudget(budget.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        // Budget History View
        <>
          {budgetHistory.length === 0 ? (
            <div className="no-expenses">No budget history available yet.</div>
          ) : (
            budgetHistory.map((history) => {
              const progress = calculateProgress(history.spentAmount, history.budgetAmount);
              const isOverBudget = (history.spentAmount || 0) > (history.budgetAmount || 0);
              
              return (
                <div className="history-card" key={history.id}>
                  <div className="history-header">
                    <div className="history-category">{history.category || 'Unknown'}</div>
                    <div className="history-period">
                      {formatPeriodType(history.periodType)} - {formatDateRange(history.periodStart, history.periodEnd)}
                    </div>
                  </div>
                  
                  <div className="history-amounts">
                    <div className="budget-vs-spent">
                      <span className="budget-amount">Budget: ${history.budgetAmount || 0}</span>
                      <span className={`spent-amount ${isOverBudget ? 'over-budget' : ''}`}>
                        Spent: ${history.spentAmount || 0}
                      </span>
                    </div>
                    
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{progress.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="history-status">
                    {isOverBudget ? (
                      <span className="status over">
                        Over budget by ${((history.spentAmount || 0) - (history.budgetAmount || 0)).toFixed(2)}
                      </span>
                    ) : (
                      <span className="status under">
                        Under budget by ${((history.budgetAmount || 0) - (history.spentAmount || 0)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

export default BudgetList;