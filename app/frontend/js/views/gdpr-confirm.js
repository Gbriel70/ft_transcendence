import api from '../services/api.js?v=8';
import { showNotification } from '../utils/notifications.js?v=8';

// Parses query string from the hash portion: #/gdpr-confirm?token=xxx
function getTokenFromHash() {
    const hash = window.location.hash; // e.g. #/gdpr-confirm?token=abc123
    const questionMark = hash.indexOf('?');
    if (questionMark === -1) return null;
    const params = new URLSearchParams(hash.slice(questionMark + 1));
    return params.get('token');
}

const GdprConfirmView = {
    render: async () => {
        const token = getTokenFromHash();

        if (!token) {
            return `
                <div class="bg-decoration"></div>
                <main class="main-content" style="display:flex;align-items:center;justify-content:center;min-height:80vh;">
                    <div class="card-modern" style="max-width:480px;width:100%;text-align:center;padding:2.5rem;">
                        <h2 style="color:#ff4444;margin-bottom:1rem;">Invalid Link</h2>
                        <p>This deletion link is invalid or missing. Please submit a new deletion request from your <a href="#/gdpr">Privacy Center</a>.</p>
                    </div>
                </main>
            `;
        }

        return `
            <div class="bg-decoration"></div>
            <main class="main-content" style="display:flex;align-items:center;justify-content:center;min-height:80vh;">
                <div class="card-modern" style="max-width:480px;width:100%;text-align:center;padding:2.5rem;">
                    <div style="width:56px;height:56px;border-radius:50%;background:#ff444422;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v6"></path><path d="M14 11v6"></path>
                            <path d="M9 6V4h6v2"></path>
                        </svg>
                    </div>
                    <h2 style="margin-bottom:0.75rem;">Confirm Account Deletion</h2>
                    <p style="margin-bottom:1.5rem;line-height:1.6;opacity:0.8;">
                        You are about to permanently delete your MiniBank account and all associated data.
                        <strong>This cannot be undone.</strong>
                    </p>
                    <div id="confirm-actions">
                        <button class="btn-primary-modern" id="confirm-delete-btn"
                            style="background:#ff4444;margin-bottom:0.75rem;width:100%;">
                            Yes, permanently delete my account
                        </button>
                        <button class="btn-secondary-modern" id="cancel-delete-btn" style="width:100%;">
                            Cancel — keep my account
                        </button>
                    </div>
                    <div id="confirm-result" style="display:none;"></div>
                </div>
            </main>
        `;
    },

    afterRender: async () => {
        const token = getTokenFromHash();
        if (!token) return;

        document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
            window.location.hash = '/dashboard';
        });

        document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
            const btn = document.getElementById('confirm-delete-btn');
            const cancelBtn = document.getElementById('cancel-delete-btn');
            if (!btn) return;

            btn.disabled = true;
            btn.textContent = 'Deleting…';
            if (cancelBtn) cancelBtn.disabled = true;

            try {
                await api.gdprConfirmDelete(token);

                // Show success message and log out
                const actions = document.getElementById('confirm-actions');
                const result = document.getElementById('confirm-result');
                if (actions) actions.style.display = 'none';
                if (result) {
                    result.style.display = 'block';
                    result.innerHTML = `
                        <div style="color:#17b5ba;margin-bottom:1rem;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <p style="margin-bottom:1rem;font-weight:600;">Account successfully deleted.</p>
                        <p style="opacity:0.75;font-size:0.9rem;">A confirmation email has been sent. You will be redirected to the login page shortly.</p>
                    `;
                }

                // Clear session and redirect
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                setTimeout(() => { window.location.hash = '/login'; }, 3000);
            } catch (err) {
                btn.disabled = false;
                btn.textContent = 'Yes, permanently delete my account';
                if (cancelBtn) cancelBtn.disabled = false;
                showNotification(err.message || 'Deletion failed. The link may have expired.', 'error');
            }
        });
    },
};

export default GdprConfirmView;
