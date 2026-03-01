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
                        </svg>
                        MiniBank
                    </a>
                    <div class="navbar-actions">
                        <a href="#/login" class="btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            <span>Back to Login</span>
                        </a>
                    </div>
                </div>
            </nav>

            <!-- Main Content -->
            <main class="main-content">
                <div class="terms-header">
                    <h1>Terms and Conditions</h1>
                    <p>Last updated: February 28, 2026</p>
                </div>

                <div class="terms-container">
                    <!-- Terms of Service Section -->
                    <section class="terms-section">
                        <h2>Terms of Service</h2>
                        
                        <div class="terms-article">
                            <h3>1. Acceptance of Terms</h3>
                            <p>By accessing and using MiniBank, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                        </div>

                        <div class="terms-article">
                            <h3>2. Use License</h3>
                            <p>Permission is granted to temporarily download one copy of the materials (information or software) on MiniBank for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                            <ul>
                                <li>Modifying or copying the materials</li>
                                <li>Using the materials for any commercial purpose or for any public display</li>
                                <li>Attempting to decompile or reverse engineer any software contained on MiniBank</li>
                                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                                <li>Removing any copyright or other proprietary notations from the materials</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>3. Disclaimer</h3>
                            <p>The materials on MiniBank are provided on an 'as is' basis. MiniBank makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                        </div>

                        <div class="terms-article">
                            <h3>4. Limitations</h3>
                            <p>In no event shall MiniBank or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MiniBank, even if MiniBank or a MiniBank authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                        </div>

                        <div class="terms-article">
                            <h3>5. Accuracy of Materials</h3>
                            <p>The materials appearing on MiniBank could include technical, typographical, or photographic errors. MiniBank does not warrant that any of the materials on MiniBank are accurate, complete, or current. MiniBank may make changes to the materials contained on MiniBank at any time without notice.</p>
                        </div>

                        <div class="terms-article">
                            <h3>6. Links</h3>
                            <p>MiniBank has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by MiniBank of the site. Use of any such linked website is at the user's own risk.</p>
                        </div>

                        <div class="terms-article">
                            <h3>7. Modifications</h3>
                            <p>MiniBank may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
                        </div>

                        <div class="terms-article">
                            <h3>8. Governing Law</h3>
                            <p>These terms and conditions are governed by and construed in accordance with the laws of Brazil, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
                        </div>
                    </section>

                    <!-- Privacy Policy Section -->
                    <section class="terms-section">
                        <h2>Privacy Policy</h2>
                        
                        <div class="terms-article">
                            <h3>1. Information We Collect</h3>
                            <p>When you create a MiniBank account, we collect information such as:</p>
                            <ul>
                                <li>Your full name and email address</li>
                                <li>Profile information including profile picture</li>
                                <li>Transaction history and financial data</li>
                                <li>IP address and device information</li>
                                <li>Usage data and activity logs</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>2. How We Use Your Information</h3>
                            <p>We use the information we collect to:</p>
                            <ul>
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process transactions and send related information</li>
                                <li>Send promotional communications (with your consent)</li>
                                <li>Monitor and analyze service usage and trends</li>
                                <li>Detect, prevent, and address fraud and security issues</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>3. Data Security</h3>
                            <p>MiniBank implements appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We use encryption and secure protocols to safeguard your data.</p>
                        </div>

                        <div class="terms-article">
                            <h3>4. Data Retention</h3>
                            <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.</p>
                        </div>

                        <div class="terms-article">
                            <h3>5. Your Rights</h3>
                            <p>Depending on your location, you may have the following rights:</p>
                            <ul>
                                <li>Access to your personal data</li>
                                <li>Correction of inaccurate data</li>
                                <li>Deletion of your data (right to be forgotten)</li>
                                <li>Restriction of processing</li>
                                <li>Data portability</li>
                            </ul>
                        </div>

                        <div class="terms-article">
                            <h3>6. Third-Party Services</h3>
                            <p>MiniBank may use third-party services for payment processing, analytics, and other functions. These services have their own privacy policies, and we encourage you to review them.</p>
                        </div>

                        <div class="terms-article">
                            <h3>7. Cookies</h3>
                            <p>MiniBank uses cookies to enhance your experience. A cookie is a small file of letters and numbers that is stored on your browser. You may choose to disable cookies through your browser settings, though this may affect your ability to use certain features of our service.</p>
                        </div>

                        <div class="terms-article">
                            <h3>8. Contact Us</h3>
                            <p>If you have questions about this privacy policy or our privacy practices, please contact us at privacy@minibank.local</p>
                        </div>
                    </section>
                </div>
            </main>
        `;
    },
    afterRender: async () => {
        // No additional functionality needed for static terms page
    }
};

export default TermsView;
