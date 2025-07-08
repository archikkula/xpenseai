import React, { useState, useEffect } from 'react';

function ExpenseList({refreshTrigger}) {
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        const storedExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        setExpenses(storedExpenses);
        console.log('Loaded Expenses:', storedExpenses);
    }, [refreshTrigger]);

    const totalAmount = expenses.reduce((total, expense) => total + expense.amount, 0);

    function deleteExpense(expenseId) {
        const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
        console.log('Deleted Expense:', expenseId);
    }

    return (
        <div className="expense-list-section">
            <h2 className="expense-list-title">Expense List</h2>
            {expenses.length === 0 ? (
                <p className="no-expenses">No expenses recorded yet.</p>
            ) : (
                <>
                    <div className="total-amount">
                        Total Amount Spent: ${totalAmount.toFixed(2)}
                    </div>
{expenses.map((expense) => (
    <div className="expense-card" key={expense.id}>
        <div className="expense-item">
            <span className="expense-description">{expense.description}</span>
            <span className="expense-amount">${expense.amount}</span>
        </div>
        <div className="expense-meta">
            <span className="expense-category">{expense.category || 'Other'}</span>
            <span className="expense-date">Date: {expense.date}</span>
        </div>
        <button 
            onClick={() => deleteExpense(expense.id)} 
            className="delete-btn"
        >
            Delete
        </button>
    </div>
))}
                </>
            )}
        </div>
    );
}

export default ExpenseList;