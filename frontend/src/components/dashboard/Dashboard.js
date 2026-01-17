import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#2563eb", // Primary blue
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#84cc16", // Lime
];

function Dashboard() {
  const [data, setData] = useState([]);
  const [viewMode, setViewMode] = useState("monthly");
  const [timeData, setTimeData] = useState([]);
  const [summary, setSummary] = useState({ totalSpent: 0, totalBudget: 0 });
  const [comparisonData, setComparisonData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processDashboardData = (expenses, budgets) => {
      // Pie Chart: group by category
      const grouped = expenses.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + parseFloat(item.amount);
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([category, amount]) => ({
        name: category,
        value: amount,
      }));
      setData(chartData);

      // Bar Chart: group by time (month/week)
      const groupedByTime = {};

      expenses.forEach((e) => {
        const date = new Date(e.date);
        let key;
        if (viewMode === "monthly") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const week = Math.ceil(date.getDate() / 7);
          key = `Week ${week}`;
        }

        groupedByTime[key] = (groupedByTime[key] || 0) + parseFloat(e.amount);
      });

      const sortedTimeData = Object.entries(groupedByTime)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, amount]) => ({
          label,
          amount,
        }));

      setTimeData(sortedTimeData);

      // Summary Box: total spent and total budget
      const totalSpent = expenses.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      const totalBudget = budgets.reduce(
        (sum, b) => sum + parseFloat(b.amount),
        0
      );
      setSummary({ totalSpent, totalBudget });

      // Budget vs Actual Comparison Chart
      const budgetMap = Object.fromEntries(
        budgets.map((b) => [b.category, parseFloat(b.amount)])
      );

      const comparison = Object.entries(grouped).map(([category, spent]) => ({
        category,
        spent,
        budget: budgetMap[category] || 0,
      }));

      // Add categories that have budgets but no expenses
      budgets.forEach(budget => {
        if (!grouped[budget.category]) {
          comparison.push({
            category: budget.category,
            spent: 0,
            budget: parseFloat(budget.amount)
          });
        }
      });

      setComparisonData(comparison);
    };

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const [expenses, budgets] = await Promise.all([
          apiService.getUserExpenses(),
          apiService.getUserBudgets()
        ]);

        processDashboardData(expenses, budgets);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [viewMode]);

  if (isLoading) {
    return (
      <div className="expense-list-section">
        <h2 className="expense-list-title">Loading Dashboard...</h2>
        <div className="no-expenses">Fetching your data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expense-list-section">
        <h2 className="expense-list-title">Dashboard Error</h2>
        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="expense-list-section">
      <h2 className="expense-list-title">Financial Overview</h2>
      
      {/* Summary Cards */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Spent</h3>
          <div className="amount">${summary.totalSpent.toFixed(2)}</div>
        </div>
        <div className="summary-card budget">
          <h3>Total Budget</h3>
          <div className="amount">${summary.totalBudget.toFixed(2)}</div>
        </div>
        <div className="summary-card remaining">
          <h3>Remaining</h3>
          <div className="amount">${Math.max(summary.totalBudget - summary.totalSpent, 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Spending by Category Chart */}
      <div className="chart-container">
        <h2 className="chart-title">Spending by Category</h2>
        {data.length === 0 ? (
          <div className="no-expenses">No expenses to visualize yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* View Toggle */}
      <div className="view-selector">
        <select
          className="form-input"
          style={{ width: "200px" }}
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="monthly">Monthly View</option>
          <option value="weekly">Weekly View</option>
        </select>
      </div>

      {/* Spending Over Time Chart */}
      <div className="chart-container">
        <h2 className="chart-title">Spending Over Time</h2>
        {timeData.length === 0 ? (
          <div className="no-expenses">No data available for selected view.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                contentStyle={{ 
                  backgroundColor: '#fefefe', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="#2563eb" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Budget vs Actual Comparison */}
      <div className="chart-container">
        <h2 className="chart-title">Budget vs Actual Spending</h2>
        {comparisonData.length === 0 ? (
          <div className="no-expenses">No budget data to compare.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                contentStyle={{ 
                  backgroundColor: '#fefefe', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar 
                dataKey="budget" 
                fill="#06b6d4" 
                name="Budget" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="spent" 
                fill="#ef4444" 
                name="Spent" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Dashboard;