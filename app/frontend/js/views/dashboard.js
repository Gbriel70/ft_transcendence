import api from '../services/api.js';

const DashboardView = {
    render: async () => {
        const user = api.getCurrentUser();
        if (!user) {
            window.location.hash = '/login';
            return '';
        }

        return `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4 w-100">
                <div class="container">
                    <a class="navbar-brand" href="#/dashboard">Minibank - ${user.name || user.email}</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <button id="logout-btn" class="btn btn-outline-light">Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div class="container">
                <div class="row">
                    <!-- Balance Card -->
                    <div class="col-md-4 mb-4">
                        <div class="card text-white bg-success mb-3">
                            <div class="card-header">Current Balance</div>
                            <div class="card-body">
                                <h2 class="card-title">R$ <span id="balance-amount">Loading...</span></h2>
                            </div>
                        </div>
                    </div>

                    <!-- Transfer Money -->
                    <div class="col-md-8 mb-4">
                        <div class="card shadow-sm">
                            <div class="card-header bg-white">
                                <h4 class="mb-0">Transfer Money</h4>
                            </div>
                            <div class="card-body">
                                <form id="transfer-form">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="recipient" class="form-label">Recipient Email</label>
                                            <input type="email" class="form-control" id="recipient" placeholder="user@example.com" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="amount" class="form-label">Amount (R$)</label>
                                            <input type="number" class="form-control" id="amount" placeholder="0.00" step="0.01" min="0.01" required>
                                        </div>
                                    </div>
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">Send Money</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transaction History -->
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow-sm">
                            <div class="card-header bg-white">
                                <h4 class="mb-0">Recent Transactions</h4>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody id="transactions-list">
                                            <tr><td colspan="4" class="text-center">Loading transactions...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
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

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                api.logout();
            });
        }

        const loadData = async () => {
            try {
                const profile = await api.getProfile(user.id).catch(err => {
                    console.error('Failed to load profile:', err);
                    return null;
                });

                const balanceEl = document.getElementById('balance-amount');
                if (profile && profile.balance !== undefined && profile.balance !== null) {
                    balanceEl.textContent = parseFloat(profile.balance).toFixed(2);
                } else {
                    balanceEl.textContent = "0.00 (Error)";
                }

                const txData = await api.getTransactions().catch(err => {
                    console.error('Failed to load transactions:', err);
                    return null;
                });

                const txList = document.getElementById('transactions-list');
                if (txData && Array.isArray(txData.data)) {
                    if (txData.data.length === 0) {
                        txList.innerHTML = '<tr><td colspan="4" class="text-center">No recent transactions.</td></tr>';
                    } else {
                        txList.innerHTML = txData.data.map(tx => `
                            <tr>
                                <td>${new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                                <td>${tx.recipient_email ? 'To: ' + tx.recipient_email : 'Transfer'}</td>
                                <td class="${tx.amount > 0 ? 'text-success' : 'text-danger'}">R$ ${Math.abs(tx.amount).toFixed(2)}</td>
                                <td><span class="badge bg-success">${tx.status || 'Completed'}</span></td>
                            </tr>
                        `).join('');
                    }
                } else {
                    txList.innerHTML = '<tr><td colspan="4" class="text-center">Unable to load transactions.</td></tr>';
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
                        alert('Transfer successful!');
                        form.reset();
                        await loadData();
                    } else {
                        throw new Error(result.error || 'Unknown error');
                    }
                } catch (error) {
                    console.error('Transfer failed', error);
                    alert(`Transfer failed: ${error.message}`);
                }
            });
        }
    }
};

export default DashboardView;
