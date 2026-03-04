import api from '../services/api.js?v=8';

const capitalizeWord = (word) => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const getDashboardDisplayName = (fullName) => {
    const safeName = (fullName || '').trim();
    if (!safeName) return 'User';

    let displayName = '';
    if (safeName.length <= 18) {
        // Capitalize each word
        displayName = safeName.split(/\s+/).map(capitalizeWord).join(' ');
    } else {
        const words = safeName.split(/\s+/).filter(Boolean);
        if (words.length > 1) {
            const firstName = capitalizeWord(words[0]);
            const lastInitial = capitalizeWord(words[words.length - 1])[0];
            const compact = `${firstName} ${lastInitial}.`;
            displayName = compact.length <= 18 ? compact : `${safeName.slice(0, 15)}...`;
        } else {
            displayName = `${safeName.slice(0, 15)}...`;
        }
    }

    return displayName;
};

const DashboardView = {
    render: async () => {
        const user = api.getCurrentUser();
        const token = sessionStorage.getItem('token');
        if (!user || !token) {
            window.location.hash = '/login';
            return '<p>Redirecting...</p>';
        }

        const fullName = user.name || 'User';
        const displayName = getDashboardDisplayName(fullName);

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
                        <div class="navbar-user-profile">
                            ${user.profile_picture
                                ? `<img src="${user.profile_picture}" alt="${user.name}" class="navbar-avatar">`
                                : `<div class="navbar-avatar navbar-avatar-fallback">${(user.name || 'U')[0].toUpperCase()}</div>`
                            }
                            <span class="navbar-username" title="${fullName}">${displayName}</span>
                        </div>
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
                <!-- Balance + Transfer Section -->
                <div class="grid grid-cols-3 mb-4">
                    <!-- Balance Card -->
                    <div class="col-span-2">
                        <div class="balance-card">
                            <div class="balance-header">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17b5ba" stroke-width="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                <span>Current Balance</span>
                            </div>
                            <p class="balance-amount">R$ <span id="balance-amount">Loading...</span></p>
                            <div class="balance-stats">
                                <div>
                                    <span class="stat-badge income">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="7 17 17 7"></polyline>
                                            <polyline points="17 17 17 7 7 7"></polyline>
                                        </svg>
                                        <span id="income-amount">+R$ 0.00</span>
                                    </span>
                                    <span class="stat-label">income</span>
                                </div>
                                <div>
                                    <span class="stat-badge expense">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="17 7 7 17"></polyline>
                                            <polyline points="7 7 7 17 17 17"></polyline>
                                        </svg>
                                        <span id="expense-amount">-R$ 0.00</span>
                                    </span>
                                    <span class="stat-label">expenses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Transfer Form -->
                    <div>
                        <div class="card-modern">
                            <div class="card-header-modern">
                                <h2>Transfer Money</h2>
                                <p>Send money to anyone instantly</p>
                            </div>
                            <form id="transfer-form" class="form-modern">
                                <div class="form-group-modern">
                                    <label for="recipient" class="form-label-modern">Recipient Email</label>
                                    <input
                                        type="email"
                                        class="form-input-modern"
                                        id="recipient"
                                        placeholder="user@example.com"
                                        required
                                    >
                                </div>
                                <div class="form-group-modern">
                                    <label for="amount" class="form-label-modern">Amount (R$)</label>
                                    <input
                                        type="number"
                                        class="form-input-modern"
                                        id="amount"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    >
                                </div>
                                <button type="submit" class="btn-primary-modern">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                    Send Money
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Wallet Section -->
                <div class="card-modern mb-4">
                    <div class="card-header-modern">
                        <h2>💳 Blockchain Wallet</h2>
                        <p>Your personal blockchain wallet</p>
                    </div>
                    <div id="wallet-content">
                        <p style="color: var(--text-secondary);">Loading wallet...</p>
                    </div>
                </div>

                <!-- Transaction History -->
                <div class="card-modern">
                    <div class="card-header-modern">
                        <h2>Recent Transactions</h2>
                        <p>Your latest financial activity</p>
                    </div>
                    <table class="table-modern">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-list">
                            <tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading transactions...</td></tr>
                        </tbody>
                    </table>
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

        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                window.location.hash = '/profile';
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                api.logout();
            });
        }

        const renderWallet = async () => {
            const walletContent = document.getElementById('wallet-content');
            if (!walletContent) return;

            try {
                const profile = await api.getProfile();
                
                if (!profile.wallet_address) {
                    walletContent.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0;">
                            <p style="color: var(--text-secondary); margin: 0;">Wallet setup is pending. Click to retry.</p>
                            <button id="btn-create-wallet" class="btn-primary-modern" style="width: auto; padding: 0.5rem 1.5rem;">
                                Retry Wallet Setup
                            </button>
                        </div>
                    `;

                    document.getElementById('btn-create-wallet').addEventListener('click', async () => {
                        const btn = document.getElementById('btn-create-wallet');
                        btn.disabled = true;
                        btn.textContent = 'Creating...';

                        try {
                            await api.createWallet();
                            window.showNotification('Wallet created successfully!', 'success');
                            await renderWallet(); // recarregar
                        } catch (error) {
                            window.showNotification(error.message || 'Failed to create wallet', 'error');
                            btn.disabled = false;
                            btn.textContent = 'Retry Wallet Setup';
                        }
                    });

                } else {
                    // Mostrar endereço
                    walletContent.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="color: var(--text-secondary); font-size: 0.85rem;">Address:</span>
                                <code style="
                                    background: var(--bg-secondary);
                                    padding: 0.3rem 0.75rem;
                                    border-radius: 6px;
                                    font-size: 0.85rem;
                                    word-break: break-all;
                                ">${profile.wallet_address}</code>
                                <button onclick="navigator.clipboard.writeText('${profile.wallet_address}').then(() => window.showNotification('Address copied!', 'success'))"
                                    style="
                                        background: none;
                                        border: 1px solid var(--border-color);
                                        border-radius: 6px;
                                        padding: 0.3rem 0.5rem;
                                        cursor: pointer;
                                        color: var(--text-secondary);
                                    "
                                    title="Copy address">📋</button>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="color: var(--text-secondary); font-size: 0.85rem;">Balance:</span>
                                <span id="eth-balance" style="font-weight: 600; color: var(--primary);">Loading...</span>
                            </div>
                        </div>
                    `;

                    // Buscar saldo ETH
                    try {
                        const balanceData = await api.getWalletBalance(profile.wallet_address);
                        const ethBalance = document.getElementById('eth-balance');
                        if (ethBalance) {
                            ethBalance.textContent = `${parseFloat(balanceData.balance).toFixed(4)} ETH`;
                        }
                    } catch (e) {
                        const ethBalance = document.getElementById('eth-balance');
                        if (ethBalance) ethBalance.textContent = 'Error loading balance';
                    }
                }

            } catch (error) {
                walletContent.innerHTML = `<p style="color: var(--text-secondary);">Error loading wallet: ${error.message}</p>`;
            }
        };

        await renderWallet();

        const loadData = async () => {
            try {
                // Check for mock data first
                const mockDataStr = localStorage.getItem('mockData');
                let mockData = null;

                if (mockDataStr) {
                    try {
                        mockData = JSON.parse(mockDataStr);
                        console.log('Using mock data:', mockData);
                    } catch (e) {
                        console.error('Failed to parse mock data:', e);
                    }
                }

                // Load balance
                const balanceEl = document.getElementById('balance-amount');
                if (mockData && mockData.balance !== undefined) {
                    balanceEl.textContent = parseFloat(mockData.balance).toFixed(2);
                } else {
                    balanceEl.textContent = "0.00";
                }

                // Load transactions
                let txData = null;
                if (mockData && mockData.transactions) {
                    txData = { data: mockData.transactions };
                } else {
                    txData = await api.getTransactions().catch(err => {
                        console.error('Failed to load transactions:', err);
                        return { data: [] };
                    });
                }

                const txList = document.getElementById('transactions-list');
                if (txData && Array.isArray(txData.data)) {
                    if (txData.data.length === 0) {
                        txList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No recent transactions.</td></tr>';
                    } else {
                        // Calculate income and expenses
                        let totalIncome = mockData && mockData.income !== undefined ? mockData.income : 0;
                        let totalExpense = mockData && mockData.expenses !== undefined ? mockData.expenses : 0;

                        // If not using mock income/expenses, calculate from transactions
                        if (!mockData || mockData.income === undefined) {
                            totalIncome = 0;
                            totalExpense = 0;
                            txData.data.forEach(tx => {
                                const amount = parseFloat(tx.amount) || 0;
                                if (amount > 0) {
                                    totalIncome += amount;
                                } else {
                                    totalExpense += Math.abs(amount);
                                }
                            });
                        }

                        // Update income/expense display
                        document.getElementById('income-amount').textContent = `+R$ ${totalIncome.toFixed(2)}`;
                        document.getElementById('expense-amount').textContent = `-R$ ${totalExpense.toFixed(2)}`;

                        txList.innerHTML = txData.data.map(tx => {
                            const amount = parseFloat(tx.amount) || 0;
                            const isIncome = amount > 0;
                            const amountClass = isIncome ? 'amount-income' : 'amount-expense';
                            const iconClass = isIncome ? 'income' : 'expense';
                            const status = tx.status || 'completed';

                            const statusIcon = status === 'completed'
                                ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
                                : status === 'pending'
                                ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
                                : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

                            const iconSvg = isIncome
                                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 17 17 7"></polyline><polyline points="17 17 17 7 7 7"></polyline></svg>'
                                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 7 7 17"></polyline><polyline points="7 7 7 17 17 17"></polyline></svg>';

                            return `
                                <tr>
                                    <td>${new Date(tx.created_at || Date.now()).toLocaleDateString('en-CA')}</td>
                                    <td>
                                        <div class="transaction-desc">
                                            <span class="transaction-icon ${iconClass}">${iconSvg}</span>
                                            <span>${tx.recipient_email ? (isIncome ? 'From: ' : 'To: ') + tx.recipient_email : 'Transfer'}</span>
                                        </div>
                                    </td>
                                    <td class="${amountClass}">${isIncome ? '+' : '-'}R$ ${Math.abs(amount).toFixed(2)}</td>
                                    <td>
                                        <span class="status-badge ${status}">
                                            ${statusIcon}
                                            ${status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                } else {
                    txList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Unable to load transactions.</td></tr>';
                }

            } catch (err) {
                console.error('Fatal loadData error:', err);
            }
        };

        await loadData();

        const form = document.getElementById('transfer-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const recipient = document.getElementById('recipient').value;
                const amount = document.getElementById('amount').value;

                try {
                    const result = await api.transfer(recipient, amount);
                    if (result && (result.success || result.id)) {
                        window.showNotification('Transfer successful!', 'success');
                        form.reset();
                        await loadData();
                    } else {
                        throw new Error(result.error || 'Unknown error');
                    }
                } catch (error) {
                    console.error('Transfer failed', error);
                    window.showNotification(`Transfer failed: ${error.message}`, 'error');
                }
            });
        }
    }
};

export default DashboardView;
