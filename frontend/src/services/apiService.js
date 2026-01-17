// src/expenseApiService.js
import authService from './authService';

const API_BASE_URL = 'http://localhost:8080/api/v1';

class ApiService {
  async createExpense(expenseData) {
    const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: expenseData.description,
        amount: expenseData.amount,
        date: expenseData.date,
        category: expenseData.category,
      }),
    });
  
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create expense');
    }
  
    return await response.json();
  }

  async getUserExpenses() {
    console.log('🔵 Calling getUserExpenses...');
    console.log('🔑 Auth token:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing');
    
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log('📞 Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Expense API Error:', errorText);
        throw new Error(errorText || 'Failed to fetch expenses');
      }
  
      const data = await response.json();
      console.log('✅ Expense data received:', data);
      return data;
    } catch (error) {
      console.error('🚨 getUserExpenses error:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId) {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete expense');
    }
  }

  async createBudget(budgetData) {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify({
        category: budgetData.category,
        amount: budgetData.amount,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create budget');
    }

    return await response.json();
  }

  async getUserBudgets() {
    console.log('🔵 Calling getUserBudgets...');
    console.log('🔑 Auth token:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing');
    
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/budgets`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log('📞 Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Budget API Error:', errorText);
        throw new Error(errorText || 'Failed to fetch budgets');
      }
  
      const data = await response.json();
      console.log('✅ Budget data received:', data);
      return data;
    } catch (error) {
      console.error('🚨 getUserBudgets error:', error);
      throw error;
    }
  }

  async deleteBudget(budgetId) {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete budget');
    }
  }

  // services/apiService.js - Add these methods to your existing ApiService class

// Add these methods to your existing ApiService class:

async getUserExpensesByPeriod(period) {
  const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch expenses');
  }

  return await response.json();
}

async getUserExpensesByDateRange(startDate, endDate) {
  const response = await authService.makeAuthenticatedRequest(
    `${API_BASE_URL}/expenses?startDate=${startDate}&endDate=${endDate}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch expenses');
  }

  return await response.json();
}

async getBudgetHistory() {
  const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/budgets/history`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch budget history');
  }

  return await response.json();
}

async getBudgetHistoryByCategory(category) {
  const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/budgets/history/${category}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch budget history');
  }

  return await response.json();
}
}

const apiService = new ApiService();
export default apiService;