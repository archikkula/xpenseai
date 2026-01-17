import React from "react";
import "./App.css";
import ExpenseForm from "./components/expense/ExpenseForm";
import ExpenseList from "./components/expense/ExpenseList";
import SignupForm from "./components/auth/SignupForm";
import LoginForm from "./components/auth/LoginForm";
import BudgetForm from "./components/budget/BudgetForm";
import BudgetList from "./components/budget/BudgetList";
import Dashboard from "./components/dashboard/Dashboard";
import ScanReceipt from "./components/scanner/ScanReceipt";
import authService from "./services/authService";
import apiService from "./services/apiService";

function App() {
  const [refreshList, setRefreshList] = React.useState(0);
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      if (authService.isAuthenticated()) {
        return JSON.parse(localStorage.getItem("currentUser")) || null;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [showLogin, setShowLogin] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("add");
  const [addPageTab, setAddPageTab] = React.useState("manual"); // "manual", "scan", or "budget"

  const handleExpenseAdded = () => {
    setRefreshList((prev) => prev + 1);
  };

  const handleSignupSuccess = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveTab("add"); // Reset view
    setAddPageTab("manual"); // Reset add page tab
  };

  // Add bulk expenses from receipt scanner
  const handleBulkExpenseAdd = async (expenses) => {
    try {
      // Add all expenses via API
      for (const expense of expenses) {
        await apiService.createExpense({
          description: expense.description,
          amount: parseFloat(expense.amount),
          date: expense.date,
          category: expense.category,
        });
      }
      
      // Refresh the expense list
      handleExpenseAdded();
      
      return true; // Success
    } catch (error) {
      console.error('Error adding bulk expenses:', error);
      throw error;
    }
  };

  // Check authentication status periodically
  React.useEffect(() => {
    const checkAuthStatus = () => {
      if (currentUser && !authService.isAuthenticated()) {
        console.log("User session expired, logging out");
        setCurrentUser(null);
        setActiveTab("add");
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <div className="app-container">
      {!currentUser ? (
        <>
          <h1 className="app-title">xpenseai</h1>
          {showLogin ? (
            <>
              <LoginForm onLoginSuccess={handleSignupSuccess} />
              <p style={{ textAlign: "center", marginTop: "12px" }}>
                Don't have an account?{" "}
                <button
                  onClick={() => setShowLogin(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f46e5",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <SignupForm onSignupSuccess={handleSignupSuccess} />
              <p style={{ textAlign: "center", marginTop: "12px" }}>
                Already have an account?{" "}
                <button
                  onClick={() => setShowLogin(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f46e5",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Log in
                </button>
              </p>
            </>
          )}
        </>
      ) : (
        <>
          {/* Top Navigation Bar */}
          <nav className="navbar">
            <div className="navbar-title">xpenseai</div>
            <div className="navbar-tabs">
              {["add", "view", "dashboard", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-btn ${activeTab === tab ? "active-tab" : ""}`}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab Content */}
          <div style={{ marginTop: "20px" }}>
            {activeTab === "add" && (
              <div className="add-expense-page">
                {/* Sub-tab Navigation for Add Page */}
                <div className="navbar-tabs" style={{ marginBottom: '20px' }}>
                  <button
                    className={`tab-btn ${addPageTab === "manual" ? "active-tab" : ""}`}
                    onClick={() => setAddPageTab("manual")}
                  >
                    Manual Entry
                  </button>
                  <button
                    className={`tab-btn ${addPageTab === "scan" ? "active-tab" : ""}`}
                    onClick={() => setAddPageTab("scan")}
                  >
                    Scan Receipt
                  </button>
                  <button
                    className={`tab-btn ${addPageTab === "budget" ? "active-tab" : ""}`}
                    onClick={() => setAddPageTab("budget")}
                  >
                    Set Budget
                  </button>
                </div>

                {/* Sub-tab Content */}
                <div className="tab-content">
                  {addPageTab === "manual" && (
                    <div className="manual-entry-section">
                      <ExpenseForm 
                        onExpenseAdded={handleExpenseAdded}
                        isFromScan={false}
                      />
                      
                      {/* Quick tips for manual entry */}
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Quick Tips:</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>Be descriptive - "Grocery shopping at Walmart" vs "Food"</li>
                          <li>AI will automatically categorize your expenses</li>
                          <li>You can manually override the category if needed</li>
                          <li>Try scanning receipts for faster bulk entry!</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {addPageTab === "scan" && (
                    <div className="scan-receipt-section">
                      <ScanReceipt 
                        onAddExpenses={handleBulkExpenseAdd}
                      />
                      
                      {/* Instructions for receipt scanning */}
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1565c0'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#0d47a1' }}>Scanning Tips:</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>Take a clear, well-lit photo of your receipt</li>
                          <li>Make sure all text is readable and not blurry</li>
                          <li>Straighten the receipt before taking the photo</li>
                          <li>AI will extract items, amounts, and suggest categories</li>
                          <li>Tax will be automatically detected and included</li>
                          <li>Review each item before adding to your expenses</li>
                          <li>You can add all items at once or one by one</li>
                          <li>Skip items you don't want to track</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {addPageTab === "budget" && (
                    <div className="budget-section">
                      <BudgetForm onBudgetAdded={handleExpenseAdded} />
                      
                      {/* Budget tips */}
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#e65100'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#bf360c' }}>Budget Tips:</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>Start with realistic amounts based on past spending</li>
                          <li>Set budgets for your most frequent categories first</li>
                          <li>Enable auto-reset to automatically renew budgets</li>
                          <li>Check the Dashboard to see budget vs actual spending</li>
                          <li>Adjust budgets monthly based on your spending patterns</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover effects for sub-tabs */}
                <style jsx>{`
                  @media (max-width: 768px) {
                    .navbar-tabs {
                      flex-direction: column !important;
                      gap: 8px !important;
                    }
                    
                    .tab-btn {
                      border-radius: 8px !important;
                      margin-bottom: 4px;
                    }
                  }
                `}</style>
              </div>
            )}

            {activeTab === "view" && (
              <>
                <ExpenseList refreshTrigger={refreshList} />
                <BudgetList refreshTrigger={refreshList} />
              </>
            )}

            {activeTab === "dashboard" && <Dashboard />}

            {activeTab === "settings" && (
              <div style={{ textAlign: "center" }}>
                <div className="form-section" style={{ maxWidth: "400px", margin: "0 auto" }}>
                  <h2 className="form-title">Account Settings</h2>
                  <div style={{ 
                    padding: "20px", 
                    backgroundColor: "#f8f9fa", 
                    borderRadius: "8px", 
                    marginBottom: "20px" 
                  }}>
                    <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                      <strong>Name:</strong> {currentUser.name}
                    </p>
                    <p style={{ margin: "0", fontSize: "16px" }}>
                      <strong>Email:</strong> {currentUser.email || 'Not provided'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="add-expense-btn"
                    style={{ 
                      maxWidth: "200px", 
                      margin: "0 auto",
                      backgroundColor: "#dc3545",
                      backgroundImage: "linear-gradient(135deg, #dc3545, #c82333)"
                    }}
                  >
                    Logout
                  </button>
                  
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#2e7d32'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1b5e20' }}>Your Progress:</h4>
                    <p style={{ margin: '5px 0' }}>Track expenses manually or by scanning receipts</p>
                    <p style={{ margin: '5px 0' }}>Set budgets to stay on track</p>
                    <p style={{ margin: '5px 0' }}>Use the dashboard to analyze spending patterns</p>
                    <p style={{ margin: '5px 0' }}>AI helps categorize your expenses automatically</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;