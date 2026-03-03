// Plain global script — loaded as <script src="..."> (not a module) so window.showNotification
// is available before any ES module view runs. No 'export' keyword.
window.showNotification = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;

    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    var icons = {
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
        '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
        '<span class="toast-message">' + message + '</span>' +
        '<button class="toast-close" aria-label="Dismiss">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
        '<div class="toast-progress"></div>';

    container.appendChild(toast);

    requestAnimationFrame(function() { toast.classList.add('toast-visible'); });

    var progress = toast.querySelector('.toast-progress');
    progress.style.transition = 'width ' + duration + 'ms linear';
    requestAnimationFrame(function() {
        requestAnimationFrame(function() { progress.style.width = '0%'; });
    });

    function dismiss() {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        toast.addEventListener('transitionend', function() { toast.remove(); }, { once: true });
    }

    var timer = setTimeout(dismiss, duration);

    toast.querySelector('.toast-close').addEventListener('click', function() {
        clearTimeout(timer);
        dismiss();
    });
};
