async function syncSidebarUser() {
    const sidebarName = document.querySelector('.sidebar-user-info .uname');
    const sidebarRole = document.querySelector('.sidebar-user-info .urole');
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const topbarAvatar = document.querySelector('.topbar-avatar');

    if (!sidebarName && !sidebarRole && !sidebarAvatar && !topbarAvatar) return;

    try {
        const response = await fetch('/api/me');
        if (!response.ok) return;

        const result = await response.json();
        const user = result.user || {};
        const name = user.nama_user || 'nama_user';
        const role = user.role || 'role_user';
        const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'NU';

        if (sidebarName) sidebarName.textContent = name;
        if (sidebarRole) sidebarRole.textContent = role;
        if (sidebarAvatar) sidebarAvatar.textContent = initials;
        if (topbarAvatar) topbarAvatar.textContent = initials;
    } catch (error) {
        console.error('Gagal memuat data user sidebar:', error);
    }
}

syncSidebarUser();
