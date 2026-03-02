import LoginView from './views/login.js';
import RegisterView from './views/register.js';
import DashboardView from './views/dashboard.js';
import ProfileView from './views/profile.js';
import TermsView from './views/terms.js';

const THEME_STORAGE_KEY = 'theme';

const routes = {
    '/': LoginView,
    '/login': LoginView,
    '/register': RegisterView,
    '/dashboard': DashboardView,
    '/profile': ProfileView,
    '/terms': TermsView
};

const getStoredTheme = () => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
};

const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const labelElements = document.querySelectorAll('.theme-toggle-label');
    labelElements.forEach((labelElement) => {
        labelElement.textContent = theme === 'light' ? 'Dark' : 'Light';
    });
};

const initializeTheme = () => {
    setTheme(getStoredTheme());
};

const setupThemeToggle = () => {
    const toggleButtons = document.querySelectorAll('#theme-toggle-btn');
    toggleButtons.forEach((toggleButton) => {
        toggleButton.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
        };
    });
};

const router = async () => {
    const content = document.getElementById('app');
    let request = location.hash.slice(1).toLowerCase() || '/';

    if (request === '') request = '/';

    const view = routes[request];

    if (!view) {
        content.innerHTML = '<h1>404 Error - Page Not Found</h1>';
        return;
    }

    try {
        content.innerHTML = await view.render();
        setupThemeToggle();
        if (view.afterRender) await view.afterRender();
    } catch (error) {
        console.error('Error rendering view:', error);
        content.innerHTML = '<h1>Error loading page. Please try again later.</h1>';
    }

};

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    initializeTheme();
    router();
});
