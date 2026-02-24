import LoginView from './views/login.js';
import RegisterView from './views/register.js';
import DashboardView from './views/dashboard.js';
import ProfileView from './views/profile.js';

const routes = {
    '/': LoginView,
    '/login': LoginView,
    '/register': RegisterView,
    '/dashboard': DashboardView,
    '/profile': ProfileView
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
        if (view.afterRender) await view.afterRender();
    } catch (error) {
        console.error('Error rendering view:', error);
        content.innerHTML = '<h1>Error loading page. Please try again later.</h1>';
    }

};

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
