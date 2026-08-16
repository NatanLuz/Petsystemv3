import axios from 'axios';

// Configuração centralizada do Axios para comunicação com a API Laravel REST
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de requisições (útil para futuramente injetar tokens do Sanctum)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respostas para tratamento centralizado de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Request Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
