import React, { useState } from 'react';

function ExpenseForm(props) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        //validation
        if(!description || !amount || !date) {
            alert('Please fill in all fields');
            return;
        }
        const newExpense = {
            id: Date.now(),
            description: description,
            amount: parseFloat(amount),
            date: new Date(date).toLocaleDateString(),
            createdAt: new Date().toISOString()
        };

        const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const updatedExpenses = [...existingExpenses, newExpense];
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
        
        console.log('New Expense Added:', newExpense);
        console.log('All Expenses:', updatedExpenses);
        if (props.onExpenseAdded) {
            props.onExpenseAdded();
        }

        setDescription('');
        setAmount('');
        setDate('');


    };
    return (
        <div>
            <h2>Add New Expense</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="What did you buy?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <br />
                <div>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="How much?"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <br />
                <div>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <br />
                <button type="submit">Add Expense</button>
            </form>  
        </div>
    );
}
export default ExpenseForm;