// pengaturan-admin.js
document.addEventListener('DOMContentLoaded', () => {
    // === ELEMENTS ===
    const navParent = document.getElementById('navPengaturan');
    const toggleBtn = navParent?.querySelector('[data-toggle="pengaturan"]');
    const subItems = document.querySelectorAll('.nav-sub-item');
    const panels = document.querySelectorAll('.settings-panel');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const topbarTitle = document.getElementById('topbarTitle');
    const profileHero = document.getElementById('profileHero');

    // === TAB METADATA ===
    const tabMeta = {
        profil: {
            title: 'Profil & Keamanan',
            breadcrumb: 'Profil',
            showHero: true
        },
        tampilan: {
            title: 'Tampilan',
            breadcrumb: 'Tampilan',
            showHero: false
        },
        sistem: {
            title: 'Sistem',
            breadcrumb: 'Sistem',
            showHero: false
        }
    };


    // === SWITCH PANEL FUNCTION ===
    function switchPanel(panelName) {
        // Update sub-items active state
        subItems.forEach(item => item.classList.remove('active'));
        const activeSub = document.querySelector(`.nav-sub-item[data-panel="${panelName}"]`);
        if (activeSub) activeSub.classList.add('active');

        // Update panels active state
        panels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`panel-${panelName}`);
        if (targetPanel) targetPanel.classList.add('active');

        // Update breadcrumb & topbar
        const meta = tabMeta[panelName];
        if (meta) {
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = meta.breadcrumb;
            if (topbarTitle) topbarTitle.textContent = meta.title;

            // Show/hide profile hero
            if (profileHero) {
                if (meta.showHero) {
                    profileHero.classList.remove('hidden-hero');
                } else {
                    profileHero.classList.add('hidden-hero');
                }
            }
        }

        // Smooth scroll to top
        const pageBody = document.querySelector('.page-body');
        if (pageBody) pageBody.scrollTop = 0;

        // Update URL hash
        window.history.replaceState(null, '', `#${panelName}`);
    }

    // === ACCORDION TOGGLE ===
    if (toggleBtn && navParent) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navParent.classList.toggle('expanded');
        });
    }

    // === SUB-ITEM CLICK (switch panel) ===
    subItems.forEach(sub => {
        sub.addEventListener('click', (e) => {
            e.preventDefault();
            const panelName = sub.dataset.panel;
            switchPanel(panelName);
        });
    });

    // === THEME OPTION SELECTION ===
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    // === PASSWORD STRENGTH INDICATOR ===
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
                if (val.length === 0) {
                    strengthText.textContent = '';
                } else if (strength <= 2) {
                    strengthText.textContent = 'Lemah';
                    strengthText.classList.add('weak');
                } else if (strength === 3) {
                    strengthText.textContent = 'Sedang';
                    strengthText.classList.add('medium');
                } else {
                    strengthText.textContent = 'Kuat';
                    strengthText.classList.add('strong');
                }
            }
        });
    }

    // === LOAD FROM URL HASH ===
    const hash = window.location.hash.substring(1);
    if (hash && tabMeta[hash]) {
        switchPanel(hash);
    } else {
        // Default: ensure Profil is active
        switchPanel('profil');
    }
});