// pengaturan-freelance.js
document.addEventListener('DOMContentLoaded', () => {

    // ── AUTH GUARD & PAGE SYNC ─────────────────────────
    async function checkAuth() {
        try {
            const res = await fetch('/api/me', { credentials: 'same-origin' });
            if (!res.ok) { window.location.href = '/login.html'; return; }
            const data = await res.json();
            const user = data.user;
            if (!user || user.role !== 'freelance') {
                window.location.href = '/login.html'; return;
            }
            syncSidebar(user);
            // Full profile (includes profil_freelance) is loaded inside loadCvProfile()
        } catch (e) {
            window.location.href = '/login.html';
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();
    }

    function syncSidebar(user) {
        const initials = getInitials(user.nama_user);
        const sidebarAvatar  = document.getElementById('sidebarAvatar');
        const sidebarName    = document.getElementById('sidebarName');
        const sidebarRole    = document.getElementById('sidebarRole');
        const topbarAvatar   = document.getElementById('topbarAvatar');
        if (sidebarAvatar) sidebarAvatar.textContent = initials;
        if (sidebarName)   sidebarName.textContent   = user.nama_user || '';
        if (sidebarRole)   sidebarRole.textContent   = user.role      || 'freelance';
        if (topbarAvatar)  topbarAvatar.textContent  = initials;
    }

    function syncHero(user, projectsCount = 0) {
        const initials = getInitials(user.nama_user);
        const heroAvatar       = document.getElementById('heroAvatar');
        const heroName         = document.getElementById('heroName');
        const heroTagline      = document.getElementById('heroTagline');
        const heroProjectCount = document.getElementById('heroProjectCount');

        if (heroAvatar) {
            // Keep camera badge child, just update text node
            const badge = heroAvatar.querySelector('.avatar-edit-badge');
            heroAvatar.textContent = initials;
            if (badge) heroAvatar.appendChild(badge);
        }
        if (heroName)   heroName.textContent   = user.nama_user || '';
        if (heroTagline) heroTagline.textContent = user.profil_freelance?.headline || '-';
        if (heroProjectCount) heroProjectCount.textContent = String(projectsCount);
    }

    checkAuth();
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

    // ──────────────────────────────────────────────────
    // CV MANAGEMENT
    // ──────────────────────────────────────────────────
    const cvHasFile   = document.getElementById('cvHasFile');
    const cvNoFile    = document.getElementById('cvNoFile');
    const cvLoading   = document.getElementById('cvLoading');
    const cvFileName  = document.getElementById('cvFileName');
    const cvUpdatedAt = document.getElementById('cvUpdatedAt');
    const cvFileSize  = document.getElementById('cvFileSize');
    const cvLinkView  = document.getElementById('cvLinkView');
    const cvLinkDownload = document.getElementById('cvLinkDownload');
    const btnChangeCv = document.getElementById('btnChangeCv');
    const btnUploadCv = document.getElementById('btnUploadCv');
    const btnSubmitCv = document.getElementById('btnSubmitCv');
    const btnCancelCv = document.getElementById('btnCancelCv');
    const cvPickedRow = document.getElementById('cvPickedRow');
    const cvPickedName = document.getElementById('cvPickedName');
    const cvInput     = document.getElementById('cvInput');
    const cvMessage   = document.getElementById('cvMessage');

    let selectedCvFile = null;
    let currentCvPath = null;

    function readJson(response) {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) return response.json();
        return Promise.resolve({ message: 'Server mengirim response yang tidak valid.' });
    }

    function setMessage(msg, type) {
        if (!cvMessage) return;
        cvMessage.textContent = msg;
        cvMessage.className = `message ${type || ''}`.trim();
        cvMessage.style.display = msg ? 'block' : 'none';
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '-';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(1)} MB`;
        const kb = bytes / 1024;
        return `${kb.toFixed(0)} KB`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
            }).format(new Date(dateStr));
        } catch {
            return '-';
        }
    }

    function showCvState(hasCv) {
        if (cvLoading)  cvLoading.style.display  = 'none';
        if (cvHasFile)  cvHasFile.style.display  = hasCv ? 'flex' : 'none';
        if (cvNoFile)   cvNoFile.style.display   = hasCv ? 'none' : 'flex';
        if (cvPickedRow) cvPickedRow.style.display = 'none';
    }

    async function loadCvProfile() {
        if (cvLoading) cvLoading.style.display = 'flex';
        if (cvHasFile) cvHasFile.style.display = 'none';
        if (cvNoFile)  cvNoFile.style.display  = 'none';

        try {
            const response = await fetch('/api/freelance/profile', { credentials: 'same-origin' });
            const result = await readJson(response);

            if (!response.ok) throw new Error(result.message || 'Gagal memuat profil CV.');

            const user = result.user;

            // Populate Data Diri fields
            if (user) {
                const inputNamaLengkap = document.getElementById('inputNamaLengkap');
                const inputEmail = document.getElementById('inputEmail');
                const inputNoTelp = document.getElementById('inputNoTelp');
                if (inputNamaLengkap) inputNamaLengkap.value = user.nama_user || '';
                if (inputEmail) inputEmail.value = user.email || '';
                if (inputNoTelp) inputNoTelp.value = user.no_telp || '';

                // Populate Profil Profesional fields
                const inputHeadline = document.getElementById('inputHeadline');
                const inputBio = document.getElementById('inputBio');
                const inputLinkedin = document.getElementById('inputLinkedin');
                const prof = user.profil_freelance || {};
                if (inputHeadline) inputHeadline.value = prof.headline || '';
                if (inputBio) inputBio.value = prof.bio || '';
                if (inputLinkedin) inputLinkedin.value = prof.linkedin || '';

                // Sync sidebar & hero with real data
                syncSidebar(user);

                // Count completed projects for hero stat
                let projectCount = 0;
                try {
                    const projRes = await fetch('/api/freelance/projects', { credentials: 'same-origin' });
                    if (projRes.ok) {
                        const projData = await projRes.json();
                        const projects = projData.projects || [];
                        const userId = user.id_user;
                        projectCount = projects.filter(p => {
                            const ids = p.id_user || [];
                            return ids.some(id => String(id) === String(userId));
                        }).length;
                    }
                } catch { /* silently ignore */ }

                syncHero(user, projectCount);
            }

            currentCvPath = user?.cv || null;
            const hasCv = Boolean(currentCvPath);

            if (hasCv) {
                // Extract filename from path e.g. "/uploads/1720000000_CV_John.pdf"
                const rawName = currentCvPath.split('/').pop() || currentCvPath;
                // Remove timestamp prefix (e.g. "1720000000_")
                const displayName = rawName.replace(/^\d+_/, '');

                if (cvFileName) cvFileName.textContent = displayName;
                if (cvUpdatedAt) cvUpdatedAt.textContent = 'Tersimpan'; // no upload date in DB
                if (cvFileSize) cvFileSize.textContent = '-';

                if (cvLinkView) cvLinkView.href = currentCvPath;
                if (cvLinkDownload) {
                    cvLinkDownload.href = currentCvPath;
                    cvLinkDownload.setAttribute('download', displayName);
                }
            }

            showCvState(hasCv);
        } catch (err) {
            if (cvLoading) cvLoading.style.display = 'none';
            setMessage(err.message, 'error');
        }
    }

    // Trigger file picker
    function openFilePicker() {
        if (cvInput) cvInput.click();
    }

    if (btnUploadCv) btnUploadCv.addEventListener('click', openFilePicker);
    if (btnChangeCv) btnChangeCv.addEventListener('click', openFilePicker);

    // File selected
    if (cvInput) {
        cvInput.addEventListener('change', () => {
            selectedCvFile = cvInput.files?.[0] || null;
            if (selectedCvFile) {
                if (cvPickedName) cvPickedName.textContent = `${selectedCvFile.name} (${formatBytes(selectedCvFile.size)})`;
                if (cvPickedRow) cvPickedRow.style.display = 'flex';
            } else {
                if (cvPickedRow) cvPickedRow.style.display = 'none';
            }
            setMessage('', '');
        });
    }

    // Cancel pick
    if (btnCancelCv) {
        btnCancelCv.addEventListener('click', () => {
            selectedCvFile = null;
            if (cvInput) cvInput.value = '';
            if (cvPickedRow) cvPickedRow.style.display = 'none';
            setMessage('', '');
        });
    }

    // Submit upload
    if (btnSubmitCv) {
        btnSubmitCv.addEventListener('click', async () => {
            if (!selectedCvFile) {
                setMessage('Pilih file CV terlebih dahulu.', 'error');
                return;
            }

            btnSubmitCv.disabled = true;
            btnSubmitCv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
            setMessage('', '');

            try {
                const formData = new FormData();
                formData.append('cv', selectedCvFile);

                const response = await fetch('/api/freelance/profile/cv', {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData,
                });
                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal mengunggah CV.');

                setMessage('CV berhasil diunggah!', 'success');
                selectedCvFile = null;
                if (cvInput) cvInput.value = '';
                if (cvPickedRow) cvPickedRow.style.display = 'none';

                // Reload CV info
                await loadCvProfile();
            } catch (err) {
                setMessage(err.message, 'error');
            } finally {
                btnSubmitCv.disabled = false;
                btnSubmitCv.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Simpan &amp; Unggah';
            }
        });
    }

    // Profile Info Saving
    const btnSaveProfileInfo = document.getElementById('btnSaveProfileInfo');
    const profileMessage = document.getElementById('profileMessage');

    if (btnSaveProfileInfo) {
        btnSaveProfileInfo.addEventListener('click', async () => {
            const inputNamaLengkap = document.getElementById('inputNamaLengkap');
            const inputEmail = document.getElementById('inputEmail');
            const inputNoTelp = document.getElementById('inputNoTelp');

            const nama_user = inputNamaLengkap?.value.trim();
            const email = inputEmail?.value.trim();
            const no_telp = inputNoTelp?.value.trim();

            if (!nama_user || !email) {
                showProfileMessage('Nama lengkap dan email wajib diisi.', 'error');
                return;
            }

            btnSaveProfileInfo.disabled = true;
            btnSaveProfileInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            showProfileMessage('', '');

            try {
                const response = await fetch('/api/freelance/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ nama_user, email, no_telp }),
                });

                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal menyimpan data diri.');

                showProfileMessage('Data diri berhasil diperbarui!', 'success');

                // Sync sidebar and hero name immediately using returned user
                if (result.user) {
                    syncSidebar(result.user);
                    const heroName = document.getElementById('heroName');
                    if (heroName) heroName.textContent = result.user.nama_user || '';
                }
            } catch (err) {
                showProfileMessage(err.message, 'error');
            } finally {
                btnSaveProfileInfo.disabled = false;
                btnSaveProfileInfo.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            }
        });
    }

    function showProfileMessage(msg, type) {
        if (!profileMessage) return;
        profileMessage.textContent = msg;
        profileMessage.className = `message ${type || ''}`.trim();
        profileMessage.style.display = msg ? 'block' : 'none';
    }

    // Professional Info Saving
    const btnSaveProfessionalInfo = document.getElementById('btnSaveProfessionalInfo');
    const professionalMessage = document.getElementById('professionalMessage');

    if (btnSaveProfessionalInfo) {
        btnSaveProfessionalInfo.addEventListener('click', async () => {
            const inputHeadline = document.getElementById('inputHeadline');
            const inputBio = document.getElementById('inputBio');
            const inputLinkedin = document.getElementById('inputLinkedin');

            const headline = inputHeadline?.value.trim();
            const bio = inputBio?.value.trim();
            const linkedin = inputLinkedin?.value.trim();

            btnSaveProfessionalInfo.disabled = true;
            btnSaveProfessionalInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            showProfessionalMessage('', '');

            try {
                const response = await fetch('/api/freelance/profile/professional', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ headline, bio, linkedin }),
                });

                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal menyimpan profil profesional.');

                showProfessionalMessage('Profil profesional berhasil diperbarui!', 'success');

                // Sync hero tagline immediately
                const heroTagline = document.getElementById('heroTagline');
                if (heroTagline) heroTagline.textContent = headline || '-';
            } catch (err) {
                showProfessionalMessage(err.message, 'error');
            } finally {
                btnSaveProfessionalInfo.disabled = false;
                btnSaveProfessionalInfo.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            }
        });
    }

    function showProfessionalMessage(msg, type) {
        if (!professionalMessage) return;
        professionalMessage.textContent = msg;
        professionalMessage.className = `message ${type || ''}`.trim();
        professionalMessage.style.display = msg ? 'block' : 'none';
    }

    // Load CV & Profile Info on page open
    loadCvProfile();
});