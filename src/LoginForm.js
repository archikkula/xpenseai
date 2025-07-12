import React, { useState } from 'react';

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      setError('Invalid email or password');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(foundUser));

    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="form-section">
      <h2 className="form-title">Log In</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleLogin}>
        <input
          className="form-input"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="add-expense-btn">
          Log In
        </button>
      </form>
    </div>
  );
}

export default LoginForm;