# Modules

## 1. Web [X]
#### - Minor: Use a backend framework [we are using Express.js]

## 3. User Management [X]
#### - Major: Standard user management and authentication. [X]
  - Users can update their profile information. [X]
  - Users can upload an avatar (with a default avatar if none provided). [X]
  - Users can add other users as friends and see their online status. [Pending]
  - Users have a profile page displaying their information. [check_if_we_dont_need_anything_else_here]
#### - Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.).
#### - Minor: Implement a complete 2FA (Two-Factor Authentication) system for the users.

## 5. Cybersecurity [X]
#### - Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets.
  - Configure strict ModSecurity/WAF.
  - Manage secrets in Vault (API keys, credentials, environment variables), encrypted and isolated.

## 7. Devops
#### - Major: Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana).
  - Elasticsearch to store and index logs.
  - Logstash to collect and transform logs.
  - Kibana for visualization and dashboards.
  - Implement log retention and archiving policies.
  - Secure access to all components.

#### - Major: Backend as microservices. [X]
  - Design loosely-coupled services with clear interfaces. [X]
  - Use REST APIs or message queues for communication. [X]
  - Each service should have a single responsibility. [X]

#### - Major: Monitoring system with Prometheus and Grafana. [X]
  - Set up Prometheus to collect metrics. [X]
  - Configure exporters and integrations. [needs_update] update blockchain exporter
  - Create custom Grafana dashboards. [needs_update]
  - Set up alerting rules. [needs_update]
  - Secure access to Grafana. [Ongoing] [Grafana is directly exposed on host port 3000 (not only through Nginx/TLS): docker-compose.yml:187. We dont have Grafana proxy/access-control rules in Nginx config, so the “secured via Nginx” claim in docs appears outdated: default.conf, MONITORING.md:183-196 . Harden this now - remove direct 3000 publish and route Grafana through Nginx HTTPS with IP allowlist/auth]

## 8. Data and Analytics
#### - Minor: GDPR compliance features.
  - Allow users to request their data.
  - Data deletion with confirmation.
  - Export user data in a readable format.
  - Confirmation emails for data operations.

## 9. Blockchain
#### - Major: Store tournament scores on the Blockchain.
  - Use Avalanche and Solidity smart contracts on a test blockchain.
  - Implement smart contracts to record, manage, and retrieve tournament scores.
  - Ensure data integrity and immutability.



# Pending

| Task | Type | Status |
|------|------|--------|
| Store tournament scores on the Blockchain | Major | Ongoing |
| Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana) | Major | Pending |
| Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.) | Minor | Pending |
| Implement a complete 2FA (Two-Factor Authentication) system for the users | Minor | Pending |
| GDPR compliance features | Minor | Pending |
|||
| Users can add other users as friends and see their online status | Sub-task | Pending |
| Users have a profile page displaying their information | Sub-task | O que temos conta? |
| Configure exporters and integrations | Sub-task | needs update |
| Create custom Grafana dashboards | Sub-task | needs update |
| Set up alerting rules | Sub-task | needs update |
| Secure access to Grafana | Sub-task | Ongoing |


Dashboard precisa ser atualizado com os dados do blockchain:
Current balance  and recent transactions needs to be correctly displayed in the dashboard. 
