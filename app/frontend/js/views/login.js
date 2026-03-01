import api from '../services/api.js';

const LoginView = {
    render: async () => {
        return `
            <!-- Background Decoration -->
            <div class="bg-decoration"></div>

            <div class="auth-container">
                <div class="auth-form-wrapper">
                    <div class="auth-header">
                        <div class="auth-logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="8" height="8" rx="2" fill="#17b5ba"/>
                                <rect x="3" y="13" width="8" height="8" rx="2" fill="#17b5ba"/>
                                <rect x="13" y="3" width="8" height="8" rx="2" fill="#1e9bd7"/>
                                <rect x="13" y="13" width="8" height="8" rx="2" fill="#1e9bd7"/>
                            </svg>
                        </div>
                        <h1>MiniBank</h1>
                        <p>Sign in to your account</p>
                    </div>

                    <form id="login-form" class="form-modern">
                        <div class="form-group-modern">
                            <label for="email" class="form-label-modern">Email Address</label>
                            <input 
                                type="email" 
                                class="form-input-modern" 
                                id="email" 
                                placeholder="you@example.com"
                                required
                            >
                        </div>
                        <div class="form-group-modern">
                            <label for="password" class="form-label-modern">Password</label>
                            <input 
                                type="password" 
                                class="form-input-modern" 
                                id="password" 
                                placeholder="••••••••"
                                required
                            >
                        </div>
                        <button type="submit" class="btn-primary-modern">
                            Sign In
                        </button>
                    </form>

                    <div class="auth-footer">
                        <p>Don't have an account? <a href="#/register">Create one</a></p>
                    </div>
                </div>
            </div>
        `;
    },
    afterRender: async () => {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await api.login(email, password);
                if (result.success) {
                    console.log('Login successful', result);
                    window.location.hash = '/dashboard';
                }
            } catch (error) {
                console.error('Login failed', error);
                alert(`Login failed: ${error.message}`);
            }
        });
    }
};

export default LoginView;
