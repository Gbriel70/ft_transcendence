const API_BASE = '/api';

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.hash = '/login';
            throw new Error('Unauthorized');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Request failed');
    }
    return response.json();
};

const api = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return { success: true, ...data };
    },

    register: async (username, email, password) => {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username, email, password })
        });
        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return { success: true, ...data };
    },

    getProfile: async (userId) => {
        const response = await fetch(`${API_BASE}/user/profile/${userId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    transfer: async (recipientEmail, amount) => {
        const response = await fetch(`${API_BASE}/transition/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ recipientEmail, amount })
        });
        return handleResponse(response);
    },

    getTransactions: async () => {
        const response = await fetch(`${API_BASE}/transition/transactions`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '/login';
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

export default api;
