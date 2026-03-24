import axios from 'axios';

const API = axios.create({
  baseURL: 'https://smart-cart-api-h8dd.onrender.com/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // שים לב לרווח אחרי ה-Bearer
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;