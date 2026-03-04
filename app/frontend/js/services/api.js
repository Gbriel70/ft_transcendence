const API_BASE = '/api';

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = sessionStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
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
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));

            try {
                const profileRes = await fetch(`${API_BASE}/users/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`
                    }
                });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    const fullUser = {
                        ...data.user,
                        name: profile.name || data.user.name,
                        profile_picture: profile.profile_picture || null,
                        wallet_address: profile.wallet_address || null
                    };
                    sessionStorage.setItem('user', JSON.stringify(fullUser));
                }
            } catch (e) {
                console.warn('Could not fetch full profile after login:', e);
            }
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

    getProfile: async () => {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    createWallet: async () => 
    {
        const response = await fetch(`${API_BASE}/users/me/wallet`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    getWalletBalance: async (walletAddress) => 
    {
        const response = await fetch(`${API_BASE}/blockchain/wallets/${walletAddress}/balance`, {
        headers: getHeaders()
        });
        return handleResponse(response);
    },

    transfer: async (recipientEmail, amount) => 
    {
         console.log('transfer called with:', recipientEmail, amount);

        // Primeiro busca o usuário pelo username para obter o ID
        const userResponse = await fetch(`${API_BASE}/users/by-email/${encodeURIComponent(recipientEmail)}`, 
        {
           headers: getHeaders()
        });

        if (!userResponse.ok)
        {
            throw new Error('User not found');
        }

        const userData = await userResponse.json();
        const to_user_id = userData.id;

        // Agora faz a transferência com o ID correto
        const response = await fetch(`${API_BASE}/tx/transactions`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ to_user_id, amount: parseFloat(amount) })
        });

        return handleResponse(response);
    },

    getTransactions: async () => {
        const response = await fetch(`${API_BASE}/tx/transactions`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        // Normalizar para sempre retornar { data: [] }
        // transaction_service pode retornar { transactions: [] } ou { data: [] } ou []
        if (Array.isArray(data))              return { data };
        if (Array.isArray(data.data))         return data;
        if (Array.isArray(data.transactions)) return { data: data.transactions };
        return { data: [] };
    },

    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.hash = '/login';
    },

    getCurrentUser: () => {
        const userStr = sessionStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    updateProfile: async (name, profilePicture) => {
        let profile_picture = null;

        if (profilePicture instanceof File) {
            profile_picture = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(profilePicture);
            });
        }

        const body = {};
        if (name !== undefined && name !== null) body.name = name;
        if (profile_picture) body.profile_picture = profile_picture;

        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        const data = await handleResponse(response);
        if (data && data.profile) {
            const currentUser = api.getCurrentUser() || {};
            currentUser.name = data.profile.name;
            currentUser.profile_picture = data.profile.profile_picture;
            sessionStorage.setItem('user', JSON.stringify(currentUser));
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
            sessionStorage.setItem('user', JSON.stringify(currentUser));
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
    },

    // ─── 2FA ────────────────────────────────────────────────────────────────

    get2FAStatus: async () => {
        const response = await fetch(`${API_BASE}/auth/2fa/status`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    setup2FA: async () => {
        const response = await fetch(`${API_BASE}/auth/2fa/setup`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    verify2FA: async (token) => {
        const response = await fetch(`${API_BASE}/auth/2fa/verify`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token })
        });
        return handleResponse(response);
    },

    disable2FA: async (token) => {
        const response = await fetch(`${API_BASE}/auth/2fa/disable`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token })
        });
        return handleResponse(response);
    },

    authenticate2FA: async (tempToken, token) => {
        const response = await fetch(`${API_BASE}/auth/2fa/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, token })
        });
        const data = await handleResponse(response);
        if (data.token) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            try {
                const profileRes = await fetch(`${API_BASE}/users/me`, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` }
                });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    const fullUser = { ...data.user,
                        name: profile.name || data.user.name,
                        profile_picture: profile.profile_picture || null,
                        wallet_address: profile.wallet_address || null
                    };
                    sessionStorage.setItem('user', JSON.stringify(fullUser));
                }
            } catch (e) {
                console.warn('Could not fetch full profile after 2FA login:', e);
            }
        }
        return { success: true, ...data };
    }
};

export default api;
