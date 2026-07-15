async function syncSidebarUser() {
    const sidebarNames = document.querySelectorAll('.sidebar-user-info .uname');
    const sidebarRoles = document.querySelectorAll('.sidebar-user-info .urole');
    const sidebarAvatars = document.querySelectorAll('.sidebar-avatar');
    const topbarAvatars = document.querySelectorAll('.topbar-avatar');

    if (!sidebarNames.length && !sidebarRoles.length && !sidebarAvatars.length && !topbarAvatars.length) return;

    try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
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

        // All freelance pages use one navigation structure so that the left
        // sidebar never changes position, labels, or active state per page.
        if (String(role).toLowerCase() === 'freelance') {
            const path = window.location.pathname;
            const activePage = path.includes('create-laporan') ? 'create-laporan'
                : path.includes('laporan.html') ? 'laporan'
                : path.includes('jadwal-kalender') ? 'calendar'
                : path.includes('pengaturan') ? 'settings'
                : 'projects';
            const navigation = [
                ['projects', '/page/freelance/dashboard.html', 'fa-folder-open', 'Project Saya'],
                ['section', '', '', 'Laporan'],
                ['create-laporan', '/page/freelance/create-laporan.html', 'fa-paper-plane', 'Kirim Laporan'],
                ['laporan', '/page/freelance/laporan.html', 'fa-file-alt', 'Laporan Saya'],
                ['calendar', '/page/freelance/jadwal-kalender.html', 'fa-calendar-alt', 'Jadwal Kalender'],
                ['section', '', '', 'Lainnya'],
            ];
            document.querySelectorAll('.sidebar-nav').forEach((nav) => {
                const menuItems = navigation.map(([key, href, icon, label]) => key === 'section'
                    ? `<div class="nav-section-title">${label}</div>`
                    : `<a href="${href}" class="nav-item${key === activePage ? ' active' : ''}"><i class="fas ${icon}"></i> ${label}</a>`
                ).join('');
                const settingsExpanded = activePage === 'settings' ? ' expanded has-active-child' : '';
                nav.innerHTML = `${menuItems}
                    <div class="nav-parent${settingsExpanded}" id="navPengaturan">
                        <button type="button" class="nav-item-toggle" data-toggle="pengaturan">
                            <i class="fas fa-cog nav-icon"></i><span class="nav-label">Pengaturan</span><i class="fas fa-chevron-down nav-arrow"></i>
                        </button>
                        <div class="nav-submenu">
                            <a href="/page/freelance/pengaturan.html#profil" class="nav-sub-item"><i class="fas fa-user-circle"></i> Profil &amp; CV</a>
                            <a href="/page/freelance/pengaturan.html#keamanan" class="nav-sub-item"><i class="fas fa-shield-alt"></i> Keamanan</a>
                            <a href="/page/freelance/pengaturan.html#kerja" class="nav-sub-item"><i class="fas fa-bullseye"></i> Preferensi Kerja</a>
                            <a href="/page/freelance/pengaturan.html#pembayaran" class="nav-sub-item"><i class="fas fa-wallet"></i> Pembayaran</a>
                            <a href="/page/freelance/pengaturan.html#privasi" class="nav-sub-item"><i class="fas fa-user-shield"></i> Privasi</a>
                        </div>
                    </div>`;
                nav.querySelector('[data-toggle="pengaturan"]')?.addEventListener('click', () => {
                    nav.querySelector('#navPengaturan')?.classList.toggle('expanded');
                });
            });
            document.querySelectorAll('.sidebar-brand-icon i').forEach((icon) => {
                icon.className = 'fas fa-briefcase';
            });
        }

        sidebarNames.forEach((element) => { element.textContent = name; });
        sidebarRoles.forEach((element) => { element.textContent = role; });
        sidebarAvatars.forEach((element) => { element.textContent = initials; });
        topbarAvatars.forEach((element) => { element.textContent = initials; });
    } catch (error) {
        console.error('Gagal memuat data user sidebar:', error);
    }
}

syncSidebarUser();
