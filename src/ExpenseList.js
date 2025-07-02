import React, { useState, useEffect } from 'react';
function ExpenseList({refreshTrigger}) {
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        const storedExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        setExpenses(storedExpenses);
        console.log('Loaded Expenses:', storedExpenses);
    }, [refreshTrigger]);

    return (
        <div>
            <h2>Expense List</h2>
            {expenses.length === 0 ? (
                <p>No expenses recorded yet.</p>
            ) : (
                <div>
                    {expenses.map((expense, idx) => (
                        <div key={expense.id || idx} style={{
                            border: '1px solid #ccc', 
                            padding: '10px', 
                            margin: '10px 0',
                            borderRadius: '5px'
                        }}>
                            <strong>{expense.description}</strong>
                            <br />
                            Amount: ${expense.amount}
                            <br />
                            Date: {expense.date}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ExpenseList;