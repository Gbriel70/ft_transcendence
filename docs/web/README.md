# README.md required sections:

Project name and description

The project concept and what it does
The main technologies used and why
How the team coordinated the work

Team members with assigned roles (PO, PM, Tech Lead, Developers)
Project management approach (how work was organized)
Technologies used with justifications
Database schema
List of features and who implemented them
Chosen modules with justifications and point calculation
Individual contributions of each member

explain brieflyeach of all the three required components:

Frontend
Backend
Database


how do we show Verify team collaboration in  Git history show proper team collaboration:
Git history:
https://github.com/Gbriel70/ft_transcendence/branches/all
Contributions summary:
./ft_transcendence/docs/contributions.md

# Web Module Documentation

## Overview

The Web module provides a complete SPA (Single Page Application) frontend with a modern, responsive interface built with vanilla JavaScript, CSS, and HTML.

## Architecture

### Frontend Structure

- **Entry point**: `app/frontend/index.html` (v8)
- **Routing**: Client-side hash-based routing in `js/app.js`
- **Views**: Modular ES6 components in `js/views/`
- **Services**: Centralized API client in `js/services/api.js`
- **Styling**: Custom modular CSS with tokens and utility classes
- **Theme**: Dark/light mode toggle with localStorage persistence

### Routes

- `/login` - User login with optional 2FA flow
- `/register` - User registration
- `/dashboard` - Main application dashboard with transactions and wallet info
- `/profile` - User profile management (name, avatar, password, 2FA, email)
- `/gdpr` - Data export and deletion request
- `/gdpr-confirm` - Confirmation link handler for GDPR operations
- `/terms` - Terms of service and privacy policies

### Technology Stack

- **Framework**: Vanilla JavaScript (ES6 modules)
- **Styling**: Custom CSS with CSS custom properties (variables)
- **Session**: `sessionStorage` for token/user isolation per-tab
- **Build/Deploy**: NGINX static hosting with SPA fallback routing

## Key Features

### Theme Management

- Default dark mode, toggle to light mode
- Persisted in `localStorage` under key `theme`
- Applied via CSS custom properties: `--primary`, `--bg-card`, `--text-primary`, etc.

### Responsive Design

- Mobile breakpoint: `768px`
- Tablet breakpoint: `1024px`
- Flexible grid layout for cards and sections
- Touch-friendly button sizing

### Accessibility

- Semantic HTML (`<label>`, `<form>`, etc.)
- `aria-label` attributes on interactive elements
- `role` attributes for regions and dialogs
- Keyboard navigation support
- Form validation feedback

## View Components

Each view is an ES6 module with:
- `render()` - returns HTML string
- `afterRender()` - attaches event listeners and hydrates DOM

Examples:
- `login.js` - email/password input; 2FA form show/hide logic
- `register.js` - signup form with password confirmation
- `profile.js` - avatar upload, name/email/password changes, 2FA setup
- `dashboard.js` - transaction list, send transfer form, wallet balance

## API Integration

Centralized in `js/services/api.js`:
- `login(email, password)` - returns token and user data
- `register(name, email, password)` - creates account
- `getProfile()` - fetches current user profile
- `updateProfile(name, picture)` - updates profile fields
- `changePassword(current, new)` - password change
- `changeEmail(newEmail)` - email update
- `setup2FA()` / `verify2FA()` / `disable2FA()` - 2FA flows
- `transfer(recipientEmail, amount)` - blockchain transfer
- `getTransactions()` - transaction history
- `exportGDPRData()` / `deleteAccount()` - GDPR operations

All requests include JWT `Authorization: Bearer <token>` header if logged in.

## Error Handling

- Toast notifications via `window.showNotification(msg, type)` (info/success/warning/error)
- Automatic logout on 401/403 errors
- Form validation (client-side) before API calls

## Files

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed page flow diagrams
- [STYLING.md](./STYLING.md) - CSS custom properties and layout system
