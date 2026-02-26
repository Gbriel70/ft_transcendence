import api from '../services/api.js';

const ProfileView = {
    render: async () => {
        const user = api.getCurrentUser();
        const token = localStorage.getItem('token');
        if (!user || !token) {
            window.location.hash = '/login';
            return '<p>Redirecting...</p>';
        }

        const profileName = user.name || user.username || '';

        return `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 w-100">
                <div class="container">
                    <a class="navbar-brand" href="#/dashboard">Minibank - Profile</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item me-2">
                                <a class="nav-link" href="#/dashboard">Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <button id="logout-btn" class="btn btn-outline-light">Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div class="container">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="mb-3">User Profile</h2>
                    </div>
                </div>
                <div class="row">
                    <!-- Profile Info Update -->
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-white">
                                <h4 class="mb-0">Personal Information</h4>
                            </div>
                            <div class="card-body">
                                <form id="profile-form">
                                    <div class="mb-3">
                                        <label for="profile-name" class="form-label">Name</label>
                                        <input type="text" class="form-control" id="profile-name" value="${profileName}" placeholder="Your full name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="profile-picture" class="form-label">Profile Picture File</label>
                                        <input type="file" class="form-control" id="profile-picture" accept="image/*">
                                        ${user.profile_picture ? `<div class="mt-2"><img src="${user.profile_picture}" alt="Current Profile" style="max-width: 100px; max-height: 100px; object-fit: cover;" class="rounded border"></div>` : ''}
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Update Profile</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Email Update -->
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-white">
                                <h4 class="mb-0">Change Email</h4>
                            </div>
                            <div class="card-body">
                                <form id="email-form">
                                    <div class="mb-3">
                                        <label for="current-email" class="form-label">Current Email</label>
                                        <input type="email" class="form-control" id="current-email" value="${user.email || ''}" disabled>
                                    </div>
                                    <div class="mb-3">
                                        <label for="new-email" class="form-label">New Email</label>
                                        <input type="email" class="form-control" id="new-email" placeholder="new@example.com" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Change Email</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Password Update -->
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-header bg-white">
                                <h4 class="mb-0">Change Password</h4>
                            </div>
                            <div class="card-body">
                                <form id="password-form">
                                    <div class="mb-3">
                                        <label for="current-password" class="form-label">Current Password</label>
                                        <input type="password" class="form-control" id="current-password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="new-password" class="form-label">New Password</label>
                                        <input type="password" class="form-control" id="new-password" required minlength="6">
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirm-password" class="form-label">Confirm New Password</label>
                                        <input type="password" class="form-control" id="confirm-password" required minlength="6">
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Change Password</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    afterRender: async () => {
        const user = api.getCurrentUser();
        if (!user) return;

        console.log('api object:', api); // <-- adicione isso temporariamente
        console.log('changeEmail:', api.changeEmail);

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => api.logout());
        }

        // Profile Update
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('profile-name').value;
                const pictureInput = document.getElementById('profile-picture');
                const picture = pictureInput.files.length > 0 ? pictureInput.files[0] : null;

                try {
                    await api.updateProfile(name, picture);
                    alert('Profile updated successfully!');
                } catch (error) {
                    alert(`Error updating profile: ${error.message}`);
                }
            });
        }

        // Email Update
        const emailForm = document.getElementById('email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newEmail = document.getElementById('new-email').value;

                try {
                    await api.changeEmail(newEmail);
                    alert('Email updated successfully!');
                    document.getElementById('current-email').value = newEmail;
                    document.getElementById('new-email').value = '';
                } catch (error) {
                    alert(`Error updating email: ${error.message}`);
                }
            });
        }

        // Password Update
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (newPassword !== confirmPassword) {
                    alert('New passwords do not match.');
                    return;
                }

                try {
                    await api.changePassword(currentPassword, newPassword);
                    alert('Password changed successfully!');
                    passwordForm.reset();
                } catch (error) {
                    alert(`Error changing password: ${error.message}`);
                }
            });
        }
    }
};

export default ProfileView;
