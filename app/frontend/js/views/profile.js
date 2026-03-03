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
        const twoFAStatus = await api.get2FAStatus().catch(() => ({ enabled: false }));
        const twoFAEnabled = twoFAStatus.enabled;

        return `
            <!-- Background Decoration -->
            <div class="bg-decoration"></div>

            <!-- Modern Navbar -->
            <nav class="navbar-modern">
                <div class="container">
                    <a class="navbar-brand-modern" href="#/dashboard">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="8" height="8" rx="2" fill="#17b5ba"/>
                            <rect x="3" y="13" width="8" height="8" rx="2" fill="#17b5ba"/>
                            <rect x="13" y="3" width="8" height="8" rx="2" fill="#1e9bd7"/>
                            <rect x="13" y="13" width="8" height="8" rx="2" fill="#1e9bd7"/>
                        </svg><span class="navbar-brand-text"><span style="font-weight: 400;">Mini</span><span style="font-weight: 700;">Bank</span></span>
                    </a>
                    <div class="navbar-actions">
                        <button class="btn-icon" id="theme-toggle-btn" type="button" aria-label="Toggle theme">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="4"></circle>
                                <path d="M12 2v2"></path>
                                <path d="M12 20v2"></path>
                                <path d="m4.93 4.93 1.41 1.41"></path>
                                <path d="m17.66 17.66 1.41 1.41"></path>
                                <path d="M2 12h2"></path>
                                <path d="M20 12h2"></path>
                                <path d="m6.34 17.66-1.41 1.41"></path>
                                <path d="m19.07 4.93-1.41 1.41"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" id="dashboard-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
                                <line x1="3.27" y1="6.5" x2="12" y2="12.5"></line>
                                <line x1="12" y1="12.5" x2="20.73" y2="6.5"></line>
                                <line x1="12" y1="12.5" x2="12" y2="21"></line>
                            </svg>
                            <span>Dashboard</span>
                        </button>
                        <button class="btn-icon btn-danger" id="logout-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="main-content">
                <div class="profile-header">
                    <h1>Profile Settings</h1>
                    <p>Manage your account information and preferences</p>
                </div>

                <div class="profile-grid">
                    <!-- Avatar Upload -->
                    <div class="card-modern profile-avatar-card">
                        <div class="avatar-upload-container">
                            <div class="profile-avatar-preview">
                                ${user.profile_picture
                                    ? `<img id="avatar-preview" src="${user.profile_picture}" alt="${profileName}" class="avatar-img">`
                                    : `<div id="avatar-preview" class="avatar-fallback">${(profileName || 'U')[0].toUpperCase()}</div>`
                                }
                            </div>
                            <div class="avatar-upload-input-wrapper">
                                <input
                                    type="file"
                                    class="avatar-upload-input"
                                    id="profile-picture"
                                    accept="image/*"
                                >
                                <label for="profile-picture" class="btn-upload-photo">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    <span>Select Photo</span>
                                </label>
                                <p id="selected-photo-name" class="avatar-upload-hint">No file selected</p>
                                <button type="button" id="update-photo-btn" class="btn-primary-modern">Update Photo</button>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Information -->
                    <div class="card-modern">
                        <div class="card-header-modern">
                            <h2>Personal Information</h2>
                        </div>
                        <form id="profile-form" class="form-modern">
                            <div class="form-group-modern">
                                <label for="profile-name" class="form-label-modern">Full Name</label>
                                <input
                                    type="text"
                                    class="form-input-modern"
                                    id="profile-name"
                                    value="${profileName}"
                                    placeholder="Your full name"
                                    required
                                >
                            </div>
                            <button type="submit" class="btn-primary-modern">Update Name</button>
                        </form>
                    </div>

                    <!-- Email Update -->
                    <div class="card-modern">
                        <div class="card-header-modern">
                            <h2>Email Address</h2>
                        </div>
                        <form id="email-form" class="form-modern">
                            <div class="form-group-modern">
                                <label for="current-email" class="form-label-modern">Current Email</label>
                                <input
                                    type="email"
                                    class="form-input-modern"
                                    id="current-email"
                                    value="${user.email || ''}"
                                    disabled
                                >
                            </div>
                            <div class="form-group-modern">
                                <label for="new-email" class="form-label-modern">New Email</label>
                                <input
                                    type="email"
                                    class="form-input-modern"
                                    id="new-email"
                                    placeholder="new@example.com"
                                    required
                                >
                            </div>
                            <button type="submit" class="btn-primary-modern">Update Email</button>
                        </form>
                    </div>

                    <!-- Password Update -->
                    <div class="card-modern">
                        <div class="card-header-modern">
                            <h2>Change Password</h2>
                        </div>
                        <form id="password-form" class="form-modern">
                            <div class="form-group-modern">
                                <label for="current-password" class="form-label-modern">Current Password</label>
                                <input
                                    type="password"
                                    class="form-input-modern"
                                    id="current-password"
                                    placeholder="••••••••"
                                    required
                                >
                            </div>
                            <div class="form-group-modern">
                                <label for="new-password" class="form-label-modern">New Password</label>
                                <input
                                    type="password"
                                    class="form-input-modern"
                                    id="new-password"
                                    placeholder="••••••••"
                                    required
                                    minlength="6"
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
                                    minlength="6"
                                >
                            </div>
                            <button type="submit" class="btn-primary-modern">Update Password</button>
                        </form>
                    </div>

                    <!-- Two-Factor Authentication -->
                    <div class="card-modern" id="twofa-card">
                        <div class="card-header-modern">
                            <h2>Two-Factor Authentication</h2>
                        </div>
                        <div class="form-modern">
                            <p style="color:var(--text-secondary);margin-bottom:1rem;">
                                ${twoFAEnabled
                                    ? '2FA is currently <strong style="color:#17b5ba;">enabled</strong>. Your account is protected.'
                                    : '2FA is currently <strong style="color:#e05;">disabled</strong>. Add an extra layer of security with an authenticator app.'}
                            </p>

                            <!-- Setup flow (hidden by default) -->
                            <div id="twofa-setup-section" style="display:none;">
                                <p class="form-label-modern" style="margin-bottom:.5rem;">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                                <div style="text-align:center;margin:1rem 0;">
                                    <img id="twofa-qr-img" src="" alt="QR Code" style="width:180px;height:180px;border-radius:8px;">
                                </div>
                                <p class="form-label-modern" style="margin-bottom:.25rem;">Or enter the secret manually:</p>
                                <code id="twofa-secret-text" style="font-size:.85rem;word-break:break-all;color:var(--text-secondary);"></code>
                                <div class="form-group-modern" style="margin-top:1rem;">
                                    <label for="twofa-verify-code" class="form-label-modern">Enter the 6-digit code to confirm</label>
                                    <input type="text" class="form-input-modern" id="twofa-verify-code" placeholder="123456" maxlength="6" autocomplete="one-time-code">
                                </div>
                                <button type="button" id="twofa-confirm-btn" class="btn-primary-modern">Confirm & Enable</button>
                                <button type="button" id="twofa-cancel-btn" class="btn-icon" style="margin-left:.75rem;">Cancel</button>
                            </div>

                            <!-- Disable flow (hidden by default) -->
                            <div id="twofa-disable-section" style="display:none;">
                                <div class="form-group-modern">
                                    <label for="twofa-disable-code" class="form-label-modern">Enter your current 6-digit code to disable 2FA</label>
                                    <input type="text" class="form-input-modern" id="twofa-disable-code" placeholder="123456" maxlength="6" autocomplete="one-time-code">
                                </div>
                                <button type="button" id="twofa-disable-confirm-btn" class="btn-primary-modern" style="background:var(--danger,#e05);">Confirm Disable</button>
                                <button type="button" id="twofa-disable-cancel-btn" class="btn-icon" style="margin-left:.75rem;">Cancel</button>
                            </div>

                            <!-- Action buttons -->
                            <div id="twofa-action-buttons">
                                ${twoFAEnabled
                                    ? `<button type="button" id="twofa-disable-btn" class="btn-primary-modern" style="background:var(--danger,#e05);">Disable 2FA</button>`
                                    : `<button type="button" id="twofa-enable-btn" class="btn-primary-modern">Enable 2FA</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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
        const user = api.getCurrentUser();
        if (!user) return;

        const dashboardBtn = document.getElementById('dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                window.location.hash = '/dashboard';
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => api.logout());
        }

        const pictureInput = document.getElementById('profile-picture');
        const selectedPhotoNameEl = document.getElementById('selected-photo-name');
        const updatePhotoBtn = document.getElementById('update-photo-btn');

        if (pictureInput) {
            pictureInput.addEventListener('change', () => {
                const file = pictureInput.files[0];
                if (!file) {
                    if (selectedPhotoNameEl) selectedPhotoNameEl.textContent = 'No file selected';
                    return;
                }

                if (selectedPhotoNameEl) selectedPhotoNameEl.textContent = file.name;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const avatarEl = document.getElementById('avatar-preview');
                    if (avatarEl) {
                        avatarEl.outerHTML = `<img id="avatar-preview" src="${e.target.result}" class="avatar-img" alt="Profile Picture">`;
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        if (updatePhotoBtn) {
            updatePhotoBtn.addEventListener('click', async () => {
                const picture = pictureInput && pictureInput.files.length > 0 ? pictureInput.files[0] : null;

                if (!picture) {
                    showNotification('Please select a photo first.', 'warning');
                    return;
                }

                try {
                    await api.updateProfile(undefined, picture);
                    showNotification('Profile photo updated successfully!', 'success');

                    const updatedUser = api.getCurrentUser();
                    const avatarEl = document.getElementById('avatar-preview');
                    if (avatarEl && updatedUser.profile_picture) {
                        avatarEl.outerHTML = `<img id="avatar-preview" src="${updatedUser.profile_picture}" class="avatar-img" alt="Profile Picture">`;
                    }

                    if (pictureInput) pictureInput.value = '';
                    if (selectedPhotoNameEl) selectedPhotoNameEl.textContent = 'No file selected';
                } catch (error) {
                    showNotification(`Error updating profile photo: ${error.message}`, 'error');
                }
            });
        }

        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('profile-name').value.trim();

                if (!name) {
                    showNotification('Name cannot be empty.', 'warning');
                    return;
                }

                try {
                    await api.updateProfile(name);
                    showNotification('Name updated successfully!', 'success');
                } catch (error) {
                    showNotification(`Error updating name: ${error.message}`, 'error');
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
                    showNotification('Email updated successfully!', 'success');
                    document.getElementById('current-email').value = newEmail;
                    document.getElementById('new-email').value = '';
                } catch (error) {
                    showNotification(`Error updating email: ${error.message}`, 'error');
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
                    showNotification('New passwords do not match.', 'warning');
                    return;
                }

                try {
                    await api.changePassword(currentPassword, newPassword);
                    showNotification('Password changed successfully!', 'success');
                    passwordForm.reset();
                } catch (error) {
                    showNotification(`Error changing password: ${error.message}`, 'error');
                }
            });
        }

        // ─── 2FA logic ───────────────────────────────────────────────────────
        const enableBtn   = document.getElementById('twofa-enable-btn');
        const disableBtn  = document.getElementById('twofa-disable-btn');
        const setupSection   = document.getElementById('twofa-setup-section');
        const disableSection = document.getElementById('twofa-disable-section');
        const actionButtons  = document.getElementById('twofa-action-buttons');

        if (enableBtn) {
            enableBtn.addEventListener('click', async () => {
                try {
                    const data = await api.setup2FA();
                    document.getElementById('twofa-qr-img').src = data.qrCode;
                    document.getElementById('twofa-secret-text').textContent = data.secret;
                    actionButtons.style.display = 'none';
                    setupSection.style.display = 'block';
                } catch (error) {
                    showNotification(`Error starting 2FA setup: ${error.message}`, 'error');
                }
            });
        }

        const confirmBtn = document.getElementById('twofa-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const code = document.getElementById('twofa-verify-code').value.trim();
                if (!code) { showNotification('Please enter the 6-digit code.', 'warning'); return; }
                try {
                    await api.verify2FA(code);
                    showNotification('2FA enabled successfully! Your account is now protected.', 'success');
                    window.location.hash = '/profile';
                } catch (error) {
                    showNotification(`Error: ${error.message}`, 'error');
                }
            });
        }

        const cancelSetupBtn = document.getElementById('twofa-cancel-btn');
        if (cancelSetupBtn) {
            cancelSetupBtn.addEventListener('click', () => {
                setupSection.style.display = 'none';
                actionButtons.style.display = 'block';
            });
        }

        if (disableBtn) {
            disableBtn.addEventListener('click', () => {
                actionButtons.style.display = 'none';
                disableSection.style.display = 'block';
            });
        }

        const disableConfirmBtn = document.getElementById('twofa-disable-confirm-btn');
        if (disableConfirmBtn) {
            disableConfirmBtn.addEventListener('click', async () => {
                const code = document.getElementById('twofa-disable-code').value.trim();
                if (!code) { showNotification('Please enter your current 6-digit code.', 'warning'); return; }
                try {
                    await api.disable2FA(code);
                    showNotification('2FA disabled successfully.', 'success');
                    window.location.hash = '/profile';
                } catch (error) {
                    showNotification(`Error: ${error.message}`, 'error');
                }
            });
        }

        const disableCancelBtn = document.getElementById('twofa-disable-cancel-btn');
        if (disableCancelBtn) {
            disableCancelBtn.addEventListener('click', () => {
                disableSection.style.display = 'none';
                actionButtons.style.display = 'block';
            });
        }
    }
};

export default ProfileView;
