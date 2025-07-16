import React, { useEffect, useState } from "react";
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
  "#4f46e5",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
];

function Dashboard() {
  const [data, setData] = useState([]); // pie data
  const [viewMode, setViewMode] = useState("monthly");
  const [timeData, setTimeData] = useState([]); // bar data
  const [summary, setSummary] = useState({ totalSpent: 0, totalBudget: 0 });
  const [comparisonData, setComparisonData] = useState([]); // budget vs actual

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const expenses = JSON.parse(
      localStorage.getItem(`expenses_${currentUser.id}`) || "[]"
    );

    const budgets = JSON.parse(
      localStorage.getItem(`budgets_${currentUser.id}`) || "[]"
    );

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
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else {
        const week = Math.ceil(date.getDate() / 7);
        key = `Week ${week}`;
      }

      groupedByTime[key] = (groupedByTime[key] || 0) + parseFloat(e.amount);
    });

    const sortedTimeData = Object.entries(groupedByTime).map(
      ([label, amount]) => ({
        label,
        amount,
      })
    );

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

    setComparisonData(comparison);
  }, [viewMode]);

  return (
    <div className="expense-list-section">
      <h2 className="expense-list-title">Spending Summary</h2>
      <div style={{
        background: "#f1f5f9",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 500,
      }}>
        <div>Total Spent: ${summary.totalSpent.toFixed(2)}</div>
        <div>Total Budget: ${summary.totalBudget.toFixed(2)}</div>
        <div>
          Remaining: ${Math.max(summary.totalBudget - summary.totalSpent, 0).toFixed(2)}
        </div>
      </div>

      <h2 className="expense-list-title">Spending by Category</h2>
      {data.length === 0 ? (
        <div className="no-expenses">No expenses to visualize yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* View Toggle Dropdown */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          margin: "32px 0 16px",
        }}
      >
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

      <h2 className="expense-list-title">Spending Over Time</h2>
      {timeData.length === 0 ? (
        <div className="no-expenses">No data available for selected view.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      )}

      <h2 className="expense-list-title">Budget vs Actual</h2>
      {comparisonData.length === 0 ? (
        <div className="no-expenses">No budget data to compare.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#10b981" name="Budget" />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default Dashboard;
