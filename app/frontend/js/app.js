import LoginView from './views/login.js';
import RegisterView from './views/register.js';
import DashboardView from './views/dashboard.js';

const routes = {
    '/': LoginView,
    '/login': LoginView,
    '/register': RegisterView,
    '/dashboard': DashboardView
};

const router = async () => {
    const content = document.getElementById('app');
    let request = location.hash.slice(1).toLowerCase() || '/';

    if (request === '') request = '/';

    let view = routes[request];

    if (!view) {
        content.innerHTML = '<h1>404 Error - Page Not Found</h1>';
        return;
    }

    content.innerHTML = await view.render();

    if (view.afterRender) await view.afterRender();
};

window.addEventListener('hashchange', router);

window.addEventListener('load', router);
