import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
  // Запит на реєстрацію
  async register(fullName, email, password, role) {
    const response = await axios.post(`${API_URL}/register`, {
      fullName,
      email,
      password,
      role
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Запит на логін
  async login(email, password) {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Вихід із системи
  logout() {
    localStorage.removeItem('user');
  },

  // Отримати дані поточного користувача
  getCurrentUser() {
    return JSON.stringify(localStorage.getItem('user'));
  }
};