import api from '../services/api.js';

const RegisterView = {
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
                        <p>Create your account</p>
                    </div>

                    <form id="register-form" class="form-modern">
                        <div class="form-group-modern">
                            <label for="username" class="form-label-modern">Full Name</label>
                            <input 
                                type="text" 
                                class="form-input-modern" 
                                id="username" 
                                placeholder="John Doe"
                                required
                            >
                        </div>
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
                        <div class="form-group-modern">
                            <label for="confirm-password" class="form-label-modern">Confirm Password</label>
                            <input 
                                type="password" 
                                class="form-input-modern" 
                                id="confirm-password" 
                                placeholder="••••••••"
                                required
                            >
                        </div>
                        <div class="terms-agreement">
                            <p>By creating an account, you agree to our <a href="#/terms">Terms and Conditions</a></p>
                        </div>
                        <button type="submit" class="btn-primary-modern">
                            Create Account
                        </button>
                    </form>

                    <div class="auth-footer">
                        <p>Already have an account? <a href="#/login">Sign In</a></p>
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
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            try {
                const result = await api.register(username, email, password);
                if (result.success) {
                    alert('Registration successful! Logging you in...');
                    window.location.hash = '/dashboard';
                }
            } catch (error) {
                console.error('Register failed', error);
                alert(`Register failed: ${error.message}`);
            }
        });
    }
};

export default RegisterView;
