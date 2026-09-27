import api from '../../services/api';

export function initializeCsrf() {
  const backend = new URL(api.defaults.baseURL, window.location.origin);
  return api.get(new URL('/sanctum/csrf-cookie', backend).href);
}

export async function getCurrentUser() {
  const response = await api.get('/user');
  return response.data;
}

export async function loginUser({ email, password }) {
  await initializeCsrf();
  const response = await api.post('/login', { email, password });
  return response.data;
}

export async function logoutUser() {
  await initializeCsrf();
  await api.post('/logout');
}

export async function authErrorMessage(error) {
  const status = error.response?.status;
  if (status === 419) {
    try {
      await initializeCsrf();
      return 'A proteção da sessão expirou e foi renovada. Tente novamente.';
    } catch {
      return 'Não foi possível renovar a proteção da sessão. Verifique sua conexão e tente novamente.';
    }
  }
  if (status === 401) return 'Sua sessão não está autenticada. Entre novamente.';
  if (status === 403) return 'Acesso negado para esta operação.';
  if (status === 429) return 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.';
  if (status === 422) {
    const labels = { email: 'E-mail', password: 'Senha' };
    const messages = Object.entries(error.response.data?.errors || {}).flatMap(
      ([field, errors]) => (Array.isArray(errors) ? errors : [errors])
        .filter((message) => typeof message === 'string')
        .map((message) => `${labels[field] || field}: ${message}`),
    );
    return messages.join(' ') || error.response.data?.message || 'Verifique os dados informados.';
  }
  return 'Não foi possível comunicar com o servidor. Tente novamente em instantes.';
}
