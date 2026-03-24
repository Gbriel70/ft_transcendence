# Frontend in the project

## Why we chose JavaScript

We chose JavaScript because it fits the goal of this frontend: lightweight, direct, and integrated with HTTP APIs without relying on a heavy framework.

Main reasons:
- simplicity in development and maintenance
- native execution in the browser
- native support for ES modules
- lower complexity for an SPA flow with multiple screens
- easy integration with authentication, 2FA, GDPR, and API calls

In short, JavaScript was chosen to deliver fast implementation with solid architectural control.

## How the frontend was built

The frontend was built as an SPA with hash-based routing and modules separated by responsibility.

Main structure:
- `index.html`: entry point
- `js/app.js`: router and app bootstrap
- `js/views/*`: screens (login, register, dashboard, profile, GDPR, terms)
- `js/services/api.js`: central backend communication layer
- `css/style.css`: global styles

Screen pattern:
1. Each view exposes `render()` for HTML.
2. A view may expose `afterRender()` for events and interactions.
3. The router switches screens without reloading the page.

## How we use it in the project flow

Practical flow:
1. The user reaches NGINX, which serves the frontend static files.
2. The SPA controls navigation and session state in the browser.
3. User actions call endpoints through `/api/*`.
4. The gateway forwards requests to the correct microservices.
5. The frontend updates the UI with authentication, profile, transfer, wallet, and GDPR responses.

## Client state, session, and security

- token and user are stored in `sessionStorage` (tab-scoped)
- theme is persisted in `localStorage`
- authenticated requests send `Authorization: Bearer <token>`
- 401/403 responses clear the session and redirect to login

## Result

The frontend provides a unified experience layer for all system modules, with simple navigation, direct service integration, and low maintenance cost.
