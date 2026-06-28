const logoutButton = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } finally {
            window.location.href = '/login.html';
        }
    });
}
