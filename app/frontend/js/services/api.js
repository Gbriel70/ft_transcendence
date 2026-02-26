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
        return { success: true, ...data };
    },

    getProfile: async (userId) => {
        const response = await fetch(`${API_BASE}/user/profile/${userId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    transfer: async (recipientEmail, amount) => {
        const response = await fetch(`${API_BASE}/transaction/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ recipientEmail, amount })
        });
        return handleResponse(response);
    },

    getTransactions: async () => {
        const response = await fetch(`${API_BASE}/transaction/transactions`, {
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
    },

    updateProfile: async (name, profilePicture) => {
        let body;
        let headers = getHeaders();

        if (profilePicture instanceof File) {
            body = new FormData();
            if (name) body.append('name', name);
            body.append('profile_picture', profilePicture);
            // Browser sets the correct multipart/form-data boundary automatically when body is FormData
            delete headers['Content-Type'];
        } else {
            body = JSON.stringify({ name, profile_picture: profilePicture });
        }

        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: headers,
            body: body
        });
        const data = await handleResponse(response);
        if (data && data.profile) {
            const currentUser = api.getCurrentUser() || {};
            currentUser.name = data.profile.name;
            currentUser.profile_picture = data.profile.profile_picture;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        return data;
    },

    changeEmail: async (newEmail) => {
        const response = await fetch(`${API_BASE}/auth/change-email`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ newEmail })
        });
        const data = await handleResponse(response);
        if (data && data.message === 'Email updated successfully') {
            const currentUser = api.getCurrentUser() || {};
            currentUser.email = newEmail;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        return data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return handleResponse(response);
    }
};

window._api = api;

export default api;
export{api};
