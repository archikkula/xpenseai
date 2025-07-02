import React from 'react';
import './App.css';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
function App() {
  const [refreshList, setRefreshList] = React.useState(0);
  const handleExpenseAdded = () => {
    setRefreshList(refreshList + 1);
  };
  return (
    <div className="App">
      <header className="App-header">
        <h1>xpenseai</h1>
        <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        <ExpenseList refreshTrigger={refreshList} />
      </header>
    </div>
  );
}
export default App;