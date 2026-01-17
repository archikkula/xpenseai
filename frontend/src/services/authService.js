// services/authService.js
const API_BASE_URL = 'http://localhost:8080/api/v1';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('jwt_token');
    this.checkTokenOnStartup();
  }

  checkTokenOnStartup() {
    if (this.token && this.isTokenExpired()) {
      console.log('Token expired on startup, clearing localStorage');
      this.logout();
    }
  }

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstname: userData.name.split(' ')[0],
        lastname: userData.name.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        password: userData.password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Registration failed');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('jwt_token', data.token);
    
    const user = {
      id: data.token,
      name: userData.name,
      email: userData.email,
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return { user, token: data.token };
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('jwt_token', data.token);
    
    const user = {
      id: data.token,
      name: email.split('@')[0],
      email: email,
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return { user, token: data.token };
  }

  logout() {
    this.token = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('currentUser');
  }

  isAuthenticated() {
    if (!this.token) return false;
    
    if (this.isTokenExpired()) {
      console.log('Token expired, logging out');
      this.logout();
      return false;
    }
    
    return true;
  }

  isTokenExpired() {
    if (!this.token) return true;
    
    try {
      const decoded = this.decodeToken(this.token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeader(),
      },
    });

    if (response.status === 401 || response.status === 403) {
      console.log('Authentication failed, token may be expired');
      this.logout();
      throw new Error('Authentication failed. Please login again.');
    }

    return response;
  }

  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

const authService = new AuthService();
export default authService;