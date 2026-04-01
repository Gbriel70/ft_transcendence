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
#### - Major: Infrastructure for log management using ELK (Elasticsearch, Logstash, Kibana). [X]
  - Elasticsearch to store and index logs. [X]
  - Logstash to collect and transform logs. [X]
  - Kibana for visualization and dashboards. [X]
  - Implement log retention and archiving policies. [X] ILM: hot(7d/10GB) → warm → cold(15d) → delete(30d)
    Navigate to Stack Management → Index Lifecycle Policies:
  - Secure access to all components. [X] xpack.security + Kibana login + nginx TLS proxy

#### - Major: Backend as microservices. [X]
  - Design loosely-coupled services with clear interfaces. [X]
  - Use REST APIs or message queues for communication. [X]
  - Each service should have a single responsibility. [X]

#### - Major: Monitoring system with Prometheus and Grafana. [X]
  - Set up Prometheus to collect metrics. [X]
  - Configure exporters and integrations. [needs_update] update blockchain exporter
  - Create custom Grafana dashboards. [needs_update]
  - Set up alerting rules. [needs_update]
  - Secure access to Grafana. [Ongoing] 

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



- Dashboard precisa ser atualizado com os dados do blockchain:
Current balance  and recent transactions needs to be correctly displayed in the dashboard.

- responsividade do frontend precisa ser melhorada para mobile (atualmente o layout quebra em telas pequenas)

- falar sobre cargos no readme

- sem erros no console do navegador, não pode ter nenhum erro


