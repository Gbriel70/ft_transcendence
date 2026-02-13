# Modules

## 1. Web
- Minor: Use a backend framework - we are using Express.js.

## 3. User Management
- Major: Standard user management and authentication.
  - Users can update their profile information.
  - Users can upload an avatar (with a default avatar if none provided).
  - Users can add other users as friends and see their online status.
  - Users have a profile page displaying their information.
- Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).
- Minor: Implement a complete 2FA (Two-Factor Authentication) system for the users.

## 5. Cybersecurity
- Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets.
  - Configure strict ModSecurity/WAF.
  - Manage secrets in Vault (API keys, credentials, environment variables), encrypted and isolated.

## 7. Devops
- Major: Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana).
  - Elasticsearch to store and index logs.
  - Logstash to collect and transform logs.
  - Kibana for visualization and dashboards.
  - Implement log retention and archiving policies.
  - Secure access to all components.
- Major: Backend as microservices.
  - Design loosely-coupled services with clear interfaces.
  - Use REST APIs or message queues for communication.
  - Each service should have a single responsibility.
- Major: Monitoring system with Prometheus and Grafana.
  - Set up Prometheus to collect metrics.
  - Configure exporters and integrations.
  - Create custom Grafana dashboards.
  - Set up alerting rules.
  - Secure access to Grafana.

## 8. Data and Analytics
- Minor: GDPR compliance features.
  - Allow users to request their data.
  - Data deletion with confirmation.
  - Export user data in a readable format.
  - Confirmation emails for data operations.

## 9. Blockchain
- Major: Store tournament scores on the Blockchain.
  - Use Avalanche and Solidity smart contracts on a test blockchain.
  - Implement smart contracts to record, manage, and retrieve tournament scores.
  - Ensure data integrity and immutability.
