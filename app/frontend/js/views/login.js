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
                        <h1><span style="font-weight: 400;">Mini</span><span style="font-weight: 700;">Bank</span></h1>
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

                    <!-- 2FA step (hidden initially) -->
                    <form id="twofa-form" class="form-modern" style="display:none;">
                        <div style="text-align:center;margin-bottom:1rem;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#17b5ba" stroke-width="1.5">
                                <rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
                                <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                            </svg>
                            <p style="color:var(--text-secondary);margin-top:.5rem;font-size:.9rem;">Enter the 6-digit code from your authenticator app</p>
                        </div>
                        <div class="form-group-modern">
                            <label for="totp-code" class="form-label-modern">Authenticator Code</label>
                            <input
                                type="text"
                                class="form-input-modern"
                                id="totp-code"
                                placeholder="123456"
                                maxlength="6"
                                autocomplete="one-time-code"
                                inputmode="numeric"
                                required
                            >
                        </div>
                        <button type="submit" class="btn-primary-modern">Verify</button>
                        <button type="button" id="twofa-back-btn" class="btn-icon" style="margin-top:.5rem;width:100%;justify-content:center;">← Back to login</button>
                    </form>

                    <div class="auth-footer">
                        <p>Don't have an account? <a href="#/register">Create one</a></p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-links">
                        <a href="#/terms">Privacy Policy</a>
                        <a href="#/terms">Terms of Service</a>
                    </div>
                    <div class="footer-copyright">
                        © 2026 MiniBank. All rights reserved.
                    </div>
                </div>
            </footer>
        `;
    },
    afterRender: async () => {
        let tempToken = null;

        const loginForm  = document.getElementById('login-form');
        const twofaForm  = document.getElementById('twofa-form');
        const backBtn    = document.getElementById('twofa-back-btn');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email    = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await api.login(email, password);

                if (result.requires2FA) {
                    // Store temp token and switch to 2FA step
                    tempToken = result.tempToken;
                    loginForm.style.display = 'none';
                    twofaForm.style.display = 'block';
                    document.getElementById('totp-code').focus();
                    return;
                }

                if (result.success) {
                    window.location.hash = '/dashboard';
                }
            } catch (error) {
                console.error('Login failed', error);
                showNotification(`Login failed: ${error.message}`, 'error');
            }
        });

        twofaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('totp-code').value.trim();
            if (!code) return;

            try {
                const result = await api.authenticate2FA(tempToken, code);
                if (result.success) {
                    window.location.hash = '/dashboard';
                }
            } catch (error) {
                console.error('2FA verification failed', error);
                showNotification(`Invalid code: ${error.message}`, 'error');
                document.getElementById('totp-code').value = '';
                document.getElementById('totp-code').focus();
            }
        });

        backBtn.addEventListener('click', () => {
            tempToken = null;
            twofaForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('totp-code').value = '';
        });
    }
};

export default LoginView;
