import api from '../services/api.js';

const LoginView = {
    render: async () => {
        return `
            <div class="container d-flex justify-content-center align-items-center vh-100">
                <div class="card shadow-lg p-4" style="max-width: 400px; width: 100%;">
                    <div class="card-body">
                        <h2 class="text-center mb-4">Login</h2>
                        <form id="login-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">Login</button>
                            </div>
                        </form>
                        <div class="mt-3 text-center">
                            <p>Don't have an account? <a href="#/register">Register</a></p>
                        </div>
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
