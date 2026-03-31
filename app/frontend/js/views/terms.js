const TermsView = {
    render: async () => {
        return `
            <!-- Background Decoration -->
            <div class="bg-decoration"></div>

            <!-- Modern Navbar -->
            <nav class="navbar-modern">
                <div class="container">
                    <a class="navbar-brand-modern" href="#/login">
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
                        <button class="btn-icon" id="back-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="main-content">
                <div class="terms-header">
                    <h1>Terms of Service and Privacy Policy</h1>
                    <p>Last updated: March 17, 2026</p>
                </div>

                <div class="terms-container">
                    <!-- Terms of Service Section -->
                    <section class="terms-section">
                        <h2>Terms of Service</h2>

                        <div class="terms-article">
                            <h3>1. About MiniBank</h3>
                            <p>MiniBank is a web application developed within the ft_transcendence project. It allows registered users to create an account, manage a profile, enable optional two-factor authentication, view a blockchain wallet address, send transfers to other users, review transaction history, and exercise privacy rights through the Privacy Center.</p>
                            <p>By accessing or using MiniBank, you agree to these terms. If you do not agree with them, do not use the service.</p>
                        </div>

                        <div class="terms-article">
                            <h3>2. Educational and Technical Nature of the Service</h3>
                            <p>MiniBank is a project platform built for demonstration, learning, and evaluation purposes. It is not presented as a regulated bank, licensed payment institution, investment platform, or custodial financial service.</p>
                            <p>You should not rely on MiniBank for real-world banking, investment, treasury, or regulated financial activity.</p>
                        </div>

                        <div class="terms-article">
                            <h3>3. Account Registration and Security</h3>
                            <p>To use protected areas of MiniBank, you must register an account with accurate information, including your name and email address. You are responsible for keeping your credentials confidential and for activity performed through your account.</p>
                            <ul>
                                <li>Use a valid email address that you control</li>
                                <li>Choose a password that you do not reuse elsewhere</li>
                                <li>Enable two-factor authentication if you want additional login protection</li>
                                <li>Notify the project operators if you believe your account has been accessed without authorization</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>4. Wallet and Transfer Features</h3>
                            <p>MiniBank may create or allow creation of a blockchain wallet linked to your profile. The application also records transfers initiated through the dashboard, including recipient, amount, status, and timestamps.</p>
                            <p>You are responsible for reviewing transfer details before submission. Wallet creation, blockchain balance retrieval, and transfer processing may depend on internal services and infrastructure that can fail, be delayed, or become temporarily unavailable.</p>
                        </div>

                        <div class="terms-article">
                            <h3>5. Acceptable Use</h3>
                            <p>You agree not to misuse MiniBank. In particular, you must not:</p>
                            <ul>
                                <li>Attempt to access accounts, tokens, wallets, or data that do not belong to you</li>
                                <li>Interfere with authentication, rate limiting, service monitoring, or security controls</li>
                                <li>Use the platform to test attacks, scrape protected data, or automate abusive traffic</li>
                                <li>Submit fraudulent transfer instructions or impersonate another user</li>
                                <li>Upload unlawful, malicious, or harmful content, including hostile files disguised as profile images</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>6. Availability and Changes</h3>
                            <p>MiniBank is provided on an as-is and as-available basis. Features, APIs, interface details, security flows, and data structures may change as the project evolves. The service may be interrupted for maintenance, testing, debugging, evaluation, or infrastructure failures.</p>
                        </div>

                        <div class="terms-article">
                            <h3>7. Suspension and Termination</h3>
                            <p>You may stop using MiniBank at any time. You may also request deletion of your account through the Privacy Center, which triggers an email confirmation flow before permanent deletion.</p>
                            <p>Access may be suspended or terminated if use of the service creates security risk, violates these terms, or interferes with the operation of the platform.</p>
                        </div>

                        <div class="terms-article">
                            <h3>8. Privacy and Data Rights</h3>
                            <p>Your use of MiniBank is also governed by the Privacy Policy below. MiniBank includes a Privacy Center where authenticated users can export their data and request deletion of their account.</p>
                            <p>Some transfer and wallet-related events may also be recorded on blockchain infrastructure. Blockchain records can be immutable by design and may not be technically alterable or erasable, which can limit how rights such as rectification or erasure are applied to on-chain data under GDPR.</p>
                        </div>

                        <div class="terms-article">
                            <h3>9. Disclaimer and Limitation of Liability</h3>
                            <p>MiniBank does not guarantee uninterrupted availability, error-free operation, or the suitability of the service for any specific financial, legal, or operational purpose. To the maximum extent permitted by applicable law, the project team is not liable for indirect, incidental, consequential, or data-loss damages arising from use of or inability to use the platform.</p>
                        </div>

                        <div class="terms-article">
                            <h3>10. Governing Law</h3>
                            <p>These terms and conditions are governed by and construed in accordance with the laws of Brazil, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
                        </div>
                    </section>

                    <!-- Privacy Policy Section -->
                    <section class="terms-section">
                        <h2>Privacy Policy</h2>

                        <div class="terms-article">
                            <h3>1. Who This Policy Covers</h3>
                            <p>This Privacy Policy explains how MiniBank handles personal data processed through the ft_transcendence project. For this project, MiniBank is operated by the project team responsible for the application and its supporting services.</p>
                        </div>

                        <div class="terms-article">
                            <h3>2. Data We Collect</h3>
                            <p>Depending on how you use MiniBank, we may collect and process:</p>
                            <ul>
                                <li>Account data such as your name, email address, and account creation date</li>
                                <li>Authentication data such as hashed password data, login events, JWT-based session use, and optional two-factor authentication status and secret</li>
                                <li>Profile data such as display name, uploaded profile picture, wallet address, and profile timestamps</li>
                                <li>Transaction-related data such as transfer recipient, amount, status, and timestamps</li>
                                <li>Privacy request data such as account deletion requests and confirmation tokens</li>
                                <li>Technical and operational data such as request metadata, service logs, metrics, and security events generated while operating the platform</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>3. How We Use Your Data</h3>
                            <p>We use this data to:</p>
                            <ul>
                                <li>Create and manage user accounts</li>
                                <li>Authenticate users and support optional TOTP-based two-factor authentication</li>
                                <li>Display and update profile information, including uploaded avatar images</li>
                                <li>Create or retrieve blockchain wallet information associated with a user profile</li>
                                <li>Process transfers and display transaction history inside the application</li>
                                <li>Send account-related emails, including GDPR export notifications and deletion confirmations</li>
                                <li>Monitor reliability, performance, and security of the platform</li>
                                <li>Respond to legal, security, and compliance obligations applicable to the project environment</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>4. Where the Data Comes From</h3>
                            <p>Most personal data is provided directly by you when you register, log in, update your profile, upload a profile picture, enable two-factor authentication, request a privacy action, or submit a transfer. Some data is generated by the system itself, such as wallet addresses, transaction records, metrics, and audit-style operational events.</p>
                        </div>

                        <div class="terms-article">
                            <h3>5. Storage, Sessions, and Security Measures</h3>
                            <p>MiniBank uses HTTPS for public access through NGINX and JWTs for authenticated API requests. In the browser, the SPA stores the active token and a snapshot of user data in sessionStorage so the session is isolated per tab and generally cleared when the tab is closed or when you log out. Theme preference may also be stored locally in the browser.</p>
                            <p>On the backend, password data is stored using bcrypt hashing, and optional two-factor authentication uses a TOTP secret managed by the authentication service. No security measure can guarantee absolute protection, but the project uses layered controls such as authentication checks, rate limiting, reverse proxy protections, and internal service boundaries.</p>
                        </div>

                        <div class="terms-article">
                            <h3>6. How Data Is Shared</h3>
                            <p>MiniBank does not describe itself as selling personal data. Data may be shared internally among the services that make the platform work, including the authentication service, user/profile service, transaction service, blockchain service, reverse proxy, and operational monitoring or email components.</p>
                            <p>These components process data only to provide the application, secure it, monitor it, or complete user-requested actions such as wallet creation, transfers, export requests, and deletion confirmations.</p>
                        </div>

                        <div class="terms-article">
                            <h3>7. Data Retention</h3>
                            <p>We retain account, profile, wallet, and transaction data for as long as the account remains active and the data is needed to operate the service. Privacy-request records, logs, and monitoring data may be retained for limited operational, debugging, or security purposes.</p>
                            <p>If you request account deletion and confirm it through the email confirmation flow, the application is designed to permanently remove the user account and associated personal data linked to it, subject to technical and legal constraints.</p>
                            <p>Where transaction or wallet references are written to a blockchain, those records may be permanent and cannot always be modified or deleted. In those cases, GDPR rights are implemented for off-chain personal data under our control, while on-chain immutability may limit full erasure or correction.</p>
                        </div>

                        <div class="terms-article">
                            <h3>8. Your Rights and Controls</h3>
                            <p>MiniBank includes user-facing controls that allow you to manage your data directly. Depending on your circumstances, you may be able to:</p>
                            <ul>
                                <li>Review and update your profile information</li>
                                <li>Change your email address or password</li>
                                <li>Enable or disable two-factor authentication</li>
                                <li>Export your personal data through the Privacy Center</li>
                                <li>Request deletion of your account and associated data through the Privacy Center</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>9. Cookies and Local Browser Storage</h3>
                            <p>MiniBank does not rely on browser cookies for the main authenticated SPA session described in this repository. Instead, it uses browser storage such as sessionStorage for active session data and localStorage for interface preferences like theme selection. Your browser may still handle standard technical data required to load pages over HTTPS.</p>
                        </div>

                        <div class="terms-article">
                            <h3>10. Contact</h3>
                            <p>If you have questions about this policy, your account data, or a privacy request, contact the project through privacy@minibank.local.</p>
                        </div>
                    </section>
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
        // No additional functionality needed for static terms page
    }
};

TermsView.afterRender = async () => {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
};

export default TermsView;
