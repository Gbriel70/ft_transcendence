# CSS in the project

## Why we use a custom CSS styling solution

We use a custom CSS styling solution to keep full control over visual identity, performance, and maintainability without adding heavy UI dependencies.

Main reasons:
- centralized design tokens for consistent colors, spacing, and states
- reusable component classes across all frontend screens
- utility classes for fast layout composition
- built-in responsive behavior and theme switching
- no framework lock-in and no unnecessary styling payload

In short, CSS in this project is implemented as an internal design system, not as page-by-page ad hoc styling.

## How it works in this project

The styling layer is centralized in a global stylesheet and consumed by SPA view modules.

Core structure:
- index.html loads global fonts and the stylesheet
- css/style.css defines tokens, components, utilities, and responsive rules
- js/views/* renders semantic class names reused across screens
- js/app.js controls theme state and toggles light and dark variants

This model keeps style logic predictable while allowing each screen to remain simple.

## Styling architecture

The stylesheet is organized into practical layers:
1. Design tokens
   - CSS variables define color palette, radius, borders, status colors, and transaction colors
2. Theme variants
   - default theme and light theme overrides through the data-theme attribute
3. Reusable components
   - cards, form fields, buttons, tables, status badges, auth wrappers, footer, and toast notifications
4. Utility classes
   - compact layout helpers for spacing and grid behavior
5. Responsive rules
   - media queries adapt grid, table spacing, and content density for smaller screens

This architecture gives us consistency similar to a framework while remaining fully project-owned.

## Why this is a modern styling solution

The implementation follows modern styling principles:
- token-driven theming with CSS variables
- component-based class reuse
- utility layer for predictable composition
- responsive-first behavior through media queries
- interaction states and transitions
- dynamic theme switching integrated with application state

It is a structured design system implemented with native modern CSS.

## Advantages in this project context

- Consistency: same visual language across login, register, dashboard, profile, GDPR, and terms screens
- Maintainability: style updates happen in centralized classes and variables
- Performance: no external UI framework bundle and minimal CSS overhead
- Control: exact UI matching to our product design decisions
- Stability: no dependency lifecycle risk from third-party UI libraries
- Team onboarding: class naming and structure are straightforward to understand

## Conclusion

In this project, we intentionally adopted a custom modern CSS design system.
It includes reusable components, utility classes, theme tokens, responsive behavior, and stateful UI styling.
Therefore, the frontend does not rely on one-off plain CSS per page, but on a consistent styling solution used across the application.


## Important files

- app/frontend/css/style.css
- app/frontend/index.html
- app/frontend/js/app.js
- app/frontend/js/views/dashboard.js
- app/frontend/js/views/register.js
- app/frontend/js/views/login.js
- app/frontend/js/views/profile.js
- app/frontend/js/views/gdpr.js
- app/frontend/js/views/gdpr-confirm.js
- app/frontend/js/views/terms.js
- app/frontend/js/utils/notifications.js

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - CODE_STRUCTURE](CODE_STRUCTURE.md)
