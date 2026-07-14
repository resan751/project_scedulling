// pengaturan-freelance.js
document.addEventListener('DOMContentLoaded', () => {
    const navParent = document.getElementById('navPengaturan');
    const toggleBtn = navParent?.querySelector('[data-toggle="pengaturan"]');
    const subItems = document.querySelectorAll('.nav-sub-item');
    const panels = document.querySelectorAll('.settings-panel');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const topbarTitle = document.getElementById('topbarTitle');
    const flHero = document.getElementById('flHero');

    // Tab metadata
    const tabMeta = {
        profil: { title: 'Profil & CV', breadcrumb: 'Profil & CV', showHero: true },
        keamanan: { title: 'Keamanan', breadcrumb: 'Keamanan', showHero: false },
        kerja: { title: 'Preferensi Kerja', breadcrumb: 'Preferensi Kerja', showHero: false },
        pembayaran: { title: 'Pembayaran', breadcrumb: 'Pembayaran', showHero: false },
        privasi: { title: 'Privasi', breadcrumb: 'Privasi', showHero: false }
    };

    function switchPanel(panelName) {
        subItems.forEach(item => item.classList.remove('active'));
        const activeSub = document.querySelector(`.nav-sub-item[data-panel="${panelName}"]`);
        if (activeSub) activeSub.classList.add('active');

        panels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`panel-${panelName}`);
        if (targetPanel) targetPanel.classList.add('active');

        const meta = tabMeta[panelName];
        if (meta) {
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = meta.breadcrumb;
            if (topbarTitle) topbarTitle.textContent = meta.title;
            if (flHero) {
                if (meta.showHero) flHero.classList.remove('hidden-hero');
                else flHero.classList.add('hidden-hero');
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', `#${panelName}`);
    }

    // Accordion toggle
    if (toggleBtn && navParent) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navParent.classList.toggle('expanded');
        });
    }

    // Sub-item click
    subItems.forEach(sub => {
        sub.addEventListener('click', (e) => {
            e.preventDefault();
            const panelName = sub.dataset.panel;
            if (tabMeta[panelName]) switchPanel(panelName);
        });
    });

    // Availability options
    document.querySelectorAll('.avail-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.avail-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });

    // Role checkbox
    document.querySelectorAll('.role-checkbox').forEach(cb => {
        cb.addEventListener('click', (e) => {
            // Delay to allow checkbox state to change
            setTimeout(() => {
                if (cb.querySelector('input').checked) {
                    cb.classList.add('checked');
                } else {
                    cb.classList.remove('checked');
                }
            }, 10);
        });
    });

    // Privacy options
    document.querySelectorAll('.privacy-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.privacy-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });

    // Password strength indicator
    const newPassword = document.getElementById('newPassword');
    const strengthBars = document.querySelectorAll('#strengthBars .strength-bar');
    const strengthText = document.getElementById('strengthText');
    if (newPassword && strengthBars.length > 0) {
        newPassword.addEventListener('input', (e) => {
            const val = e.target.value;
            let strength = 0;
            if (val.length >= 8) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            strengthBars.forEach((bar, i) => {
                bar.classList.remove('active', 'weak', 'medium', 'strong');
                if (i < strength) {
                    bar.classList.add('active');
                    if (strength <= 2) bar.classList.add('weak');
                    else if (strength === 3) bar.classList.add('medium');
                    else bar.classList.add('strong');
                }
            });

            if (strengthText) {
                strengthText.classList.remove('weak', 'medium', 'strong');
                if (val.length === 0) strengthText.textContent = '';
                else if (strength <= 2) { strengthText.textContent = 'Lemah'; strengthText.classList.add('weak'); }
                else if (strength === 3) { strengthText.textContent = 'Sedang'; strengthText.classList.add('medium'); }
                else { strengthText.textContent = 'Kuat'; strengthText.classList.add('strong'); }
            }
        });
    }

    // Load from hash
    const hash = window.location.hash.substring(1);
    if (hash && tabMeta[hash]) switchPanel(hash);
    else switchPanel('profil');
});