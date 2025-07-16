import React from "react";
import "./App.css";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import SignupForm from "./SignupForm";
import LoginForm from "./LoginForm";
import BudgetForm from "./BudgetForm";
import BudgetList from "./BudgetList";
import Dashboard from "./Dashboard";

function App() {
  const [refreshList, setRefreshList] = React.useState(0);
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  });
  const [showLogin, setShowLogin] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("add");

  const handleExpenseAdded = () => {
    setRefreshList((prev) => prev + 1);
  };

  const handleSignupSuccess = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setActiveTab("add"); // Reset view
  };

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
              {["add", "view", "dashboard", "scan", "settings"].map((tab) => (
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
              <>
                <ExpenseForm onExpenseAdded={handleExpenseAdded} />
                <div style={{ marginTop: "32px" }}>
                  <BudgetForm onBudgetAdded={handleExpenseAdded} />
                </div>
              </>
            )}

            {activeTab === "view" && (
              <>
                <ExpenseList refreshTrigger={refreshList} />
                <BudgetList refreshTrigger={refreshList} />
              </>
            )}
            {activeTab === "dashboard" && <Dashboard />}

            {activeTab === "scan" && (
              <div style={{ textAlign: "center" }}>
                📷 Receipt scanning coming soon!
              </div>
            )}
            {activeTab === "settings" && (
              <div style={{ textAlign: "center" }}>
                <p>
                  Logged in as: <strong>{currentUser.name}</strong>
                </p>
                <button
                  onClick={handleLogout}
                  className="add-expense-btn"
                  style={{ maxWidth: "200px", marginTop: "12px" }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
