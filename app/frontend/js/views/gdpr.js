import api from '../services/api.js?v=8';

const GdprView = {
    render: async () => {
        const user = api.getCurrentUser();
        const token = sessionStorage.getItem('token');
        if (!user || !token) {
            window.location.hash = '/login';
            return '<p>Redirecting...</p>';
        }

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
                                <path d="M12 2v2"></path><path d="M12 20v2"></path>
                                <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
                                <path d="M2 12h2"></path><path d="M20 12h2"></path>
                                <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" id="profile-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Profile</span>
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
                    <h1>Privacy Center</h1>
                    <p>Manage your personal data in accordance with GDPR</p>
                </div>

                <div class="profile-grid" style="max-width: 800px; margin: 0 auto;">

                    <!-- Export Data Card -->
                    <div class="card-modern" style="margin-bottom: 1.5rem;" role="region" aria-labelledby="export-heading">
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                            <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#17b5ba22,#17b5ba44);display:flex;align-items:center;justify-content:center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17b5ba" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </div>
                            <div>
                                <h2 id="export-heading" style="margin:0;font-size:1.1rem;">Export My Data</h2>
                                <p style="margin:0;font-size:0.85rem;opacity:0.7;">Article 20 — Right to data portability</p>
                            </div>
                        </div>
                        <p style="margin-bottom:1.25rem;line-height:1.6;">
                            Download a copy of all personal data associated with your account in a structured, machine-readable JSON format.
                            A confirmation email will be sent to <strong>${user.email || 'your registered email'}</strong>.
                        </p>
                        <button class="btn-primary-modern" id="export-btn" style="width:auto; padding: 0.6rem 1.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download My Data
                        </button>
                    </div>

                    <!-- Delete Account Card -->
                    <div class="card-modern" style="border: 1px solid #ff444433;" role="region" aria-labelledby="delete-heading">
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                            <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#ff444422,#ff444444);display:flex;align-items:center;justify-content:center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6l-1 14H6L5 6"></path>
                                    <path d="M10 11v6"></path><path d="M14 11v6"></path>
                                    <path d="M9 6V4h6v2"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 id="delete-heading" style="margin:0;font-size:1.1rem;color:#ff4444;">Delete My Account</h2>
                                <p style="margin:0;font-size:0.85rem;opacity:0.7;">Article 17 — Right to erasure ("right to be forgotten")</p>
                            </div>
                        </div>
                        <p style="margin-bottom:0.75rem;line-height:1.6;">
                            Permanently delete your account and all associated personal data, including your profile, wallet, and transaction history.
                            <strong>This action is irreversible.</strong>
                        </p>
                        <p style="margin-bottom:1.25rem;line-height:1.6;opacity:0.8;font-size:0.9rem;">
                            A confirmation link will be sent to your email address. Your account will only be deleted after you click the link.
                        </p>

                        <!-- Confirmation step (hidden initially) -->
                        <div id="delete-confirm-box" style="display:none; background:var(--card-bg,#1a1a2e); border:1px solid #ff444466; border-radius:10px; padding:1.25rem; margin-bottom:1.25rem;">
                            <p style="margin:0 0 0.75rem;font-weight:600;color:#ff4444;">⚠️ Are you absolutely sure?</p>
                            <p style="margin:0 0 1rem;font-size:0.9rem;line-height:1.5;">Type <strong>DELETE</strong> to confirm you want to request account deletion.</p>
                            <input
                                type="text"
                                id="delete-confirm-input"
                                placeholder="Type DELETE to confirm"
                                class="form-input-modern"
                                autocomplete="off"
                                aria-label="Type DELETE to confirm account deletion"
                                style="margin-bottom:0.75rem;"
                            />
                            <div style="display:flex;gap:0.75rem;">
                                <button class="btn-primary-modern" id="delete-confirm-btn" disabled
                                    style="background: #ff4444; width:auto; padding: 0.6rem 1.25rem;">
                                    Send Deletion Request
                                </button>
                                <button class="btn-secondary-modern" id="delete-cancel-btn"
                                    style="width:auto; padding: 0.6rem 1.25rem;">
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <button class="btn-secondary-modern" id="delete-request-btn"
                            style="width:auto; padding: 0.6rem 1.5rem; border-color:#ff4444; color:#ff4444;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14H6L5 6"></path>
                                <path d="M10 11v6"></path><path d="M14 11v6"></path>
                                <path d="M9 6V4h6v2"></path>
                            </svg>
                            Request Account Deletion
                        </button>
                    </div>

                </div>
            </main>
        `;
    },

    afterRender: async () => {
        const user = api.getCurrentUser();

        // Nav buttons
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            window.location.hash = '/profile';
        });
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            api.logout();
        });

        // ── Export Data ──────────────────────────────────────────────────────
        document.getElementById('export-btn')?.addEventListener('click', async () => {
            const btn = document.getElementById('export-btn');
            if (!btn) return;
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = 'Preparing export…';
            try {
                const blob = await api.gdprExport();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'my-minibank-data.json';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
                window.showNotification('Data export downloaded. A confirmation email has been sent.', 'success');
            } catch (err) {
                window.showNotification(err.message || 'Export failed. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = original;
            }
        });

        // ── Delete Account ───────────────────────────────────────────────────
        const requestBtn = document.getElementById('delete-request-btn');
        const confirmBox = document.getElementById('delete-confirm-box');
        const confirmInput = document.getElementById('delete-confirm-input');
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const cancelBtn = document.getElementById('delete-cancel-btn');

        requestBtn?.addEventListener('click', () => {
            requestBtn.style.display = 'none';
            confirmBox.style.display = 'block';
            confirmInput.focus();
        });

        cancelBtn?.addEventListener('click', () => {
            confirmBox.style.display = 'none';
            requestBtn.style.display = '';
            confirmInput.value = '';
            confirmBtn.disabled = true;
        });

        confirmInput?.addEventListener('input', () => {
            confirmBtn.disabled = confirmInput.value.trim().toUpperCase() !== 'DELETE';
        });

        confirmBtn?.addEventListener('click', async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Sending…';
            try {
                await api.gdprDeleteRequest();
                window.showNotification('Deletion request sent. Check your email to confirm.', 'success');
                confirmBox.style.display = 'none';
                requestBtn.style.display = '';
                confirmInput.value = '';
            } catch (err) {
                window.showNotification(err.message || 'Request failed. Please try again.', 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Send Deletion Request';
            }
        });
    },
};

export default GdprView;
