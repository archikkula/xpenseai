import React, { useState } from 'react';
import { categorizeExpense } from './aiService';

function ExpenseForm(props) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(!description || !amount || !date) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        
        try {
            // Get AI category
            const category = await categorizeExpense(description, amount);
            
            const newExpense = {
                id: Date.now(),
                description: description,
                amount: parseFloat(amount),
                date: new Date(date).toLocaleDateString(),
                category: category,
                createdAt: new Date().toISOString()
            };

            const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const updatedExpenses = [...existingExpenses, newExpense];
            localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
            
            console.log('New Expense Added:', newExpense);
            
            if (props.onExpenseAdded) {
                props.onExpenseAdded();
            }

            setDescription('');
            setAmount('');
            setDate('');
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Error adding expense. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-section">
            <h2 className="form-title">Add New Expense</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="What did you buy?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        placeholder="How much?"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <input
                        className="form-input"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button 
                    type="submit" 
                    className="add-expense-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Adding...' : 'Add Expense'}
                </button>
            </form>  
        </div>
    );
}

export default ExpenseForm;