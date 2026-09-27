import axios from 'axios';

// Configuração centralizada do Axios para comunicação com a API Laravel REST
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
});

export default api;
