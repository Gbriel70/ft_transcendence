import api from '../services/api.js';

const RegisterView = {
    render: async () => {
        return `
            <div class="container d-flex justify-content-center align-items-center vh-100">
                <div class="card shadow-lg p-4" style="max-width: 400px; width: 100%;">
                    <div class="card-body">
                        <h2 class="text-center mb-4">Register</h2>
                        <form id="register-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                             <div class="mb-3">
                                <label for="confirm-password" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="confirm-password" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success">Register</button>
                            </div>
                        </form>
                        <div class="mt-3 text-center">
                            <p>Already have an account? <a href="#/login">Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    afterRender: async () => {
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

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
