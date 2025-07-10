import React from "react";
import "./App.css";
import ExpenseList from "./ExpenseList";
import ExpenseForm from "./ExpenseForm";
import SignupForm from "./SignupForm";

function App() {
  const [refreshList, setRefreshList] = React.useState(0);

  // ✅ Safe JSON.parse to avoid crash if data is corrupted or missing
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch (e) {
      return null;
    }
  });

  const handleExpenseAdded = () => {
    setRefreshList((prev) => prev + 1);
  };

  const handleSignupSuccess = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(user);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">xpenseai</h1>
      {!currentUser ? (
        <SignupForm onSignupSuccess={handleSignupSuccess} />
      ) : (
        <>
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
          <ExpenseList refreshTrigger={refreshList} />
        </>
      )}
    </div>
  );
}

export default App;
