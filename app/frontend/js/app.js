// v5 — dynamic imports bust nginx's 1-year immutable cache on view files
const V = '?v=7';

const THEME_STORAGE_KEY = 'theme';

const routes = {
    '/':          () => import('./views/login.js'     + V),
    '/login':     () => import('./views/login.js'     + V),
    '/register':  () => import('./views/register.js'  + V),
    '/dashboard': () => import('./views/dashboard.js' + V),
    '/profile':   () => import('./views/profile.js'   + V),
    '/terms':     () => import('./views/terms.js'     + V),
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

    const loader = routes[request];

    if (!loader) {
        content.innerHTML = '<h1>404 Error - Page Not Found</h1>';
        return;
    }

    try {
        const module = await loader();
        const view = module.default;
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
