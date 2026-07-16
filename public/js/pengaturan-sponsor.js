// pengaturan-sponsor.js
document.addEventListener('DOMContentLoaded', () => {

    // ── AUTH GUARD & PAGE SYNC ─────────────────────────
    function readJson(response) {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) return response.json();
        return Promise.resolve({ message: 'Server mengirim response yang tidak valid.' });
    }

    let currentUser = null;

    async function checkAuth() {
        try {
            const res = await fetch('/api/me', { credentials: 'same-origin' });
            if (!res.ok) { window.location.href = '/login.html'; return; }
            const data = await res.json();
            const user = data.user;
            if (!user || user.role !== 'sponsor') {
                window.location.href = '/login.html'; return;
            }
            currentUser = user;
            syncSidebar(user);
            loadProjectCount();
            // Full profile (includes profil_usaha) is loaded inside loadBusinessProfile()
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
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const sidebarName = document.getElementById('sidebarName');
        const sidebarRole = document.getElementById('sidebarRole');
        const topbarAvatar = document.getElementById('topbarAvatar');
        if (sidebarAvatar) sidebarAvatar.textContent = initials;
        if (sidebarName) sidebarName.textContent = user.nama_user || '';
        if (sidebarRole) sidebarRole.textContent = user.role || 'sponsor';
        if (topbarAvatar) topbarAvatar.textContent = initials;
    }

    function syncHero(user) {
        const profil = user.profil_usaha || {};
        const spHeroName = document.getElementById('spHeroName');
        const spHeroTagline = document.getElementById('spHeroTagline');
        const spHeroAddress = document.getElementById('spHeroAddress');
        const spHeroDesc = document.getElementById('spHeroDesc');
        const spHeroFounded = document.getElementById('spHeroFounded');
        const spHeroFoundedYear = document.getElementById('spHeroFoundedYear');

        if (spHeroName) spHeroName.textContent = profil.nama_usaha || user.nama_user || '';
        if (spHeroTagline) spHeroTagline.textContent = profil.bidang_usaha || '-';
        if (spHeroAddress) spHeroAddress.textContent = profil.alamat_usaha || '-';

        if (spHeroDesc) {
            if (profil.deskripsi_usaha) {
                spHeroDesc.textContent = profil.deskripsi_usaha;
                spHeroDesc.style.display = 'block';
            } else {
                spHeroDesc.textContent = '';
                spHeroDesc.style.display = 'none';
            }
        }

        if (spHeroFounded && spHeroFoundedYear) {
            if (profil.tahun_berdiri) {
                spHeroFoundedYear.textContent = profil.tahun_berdiri;
                spHeroFounded.style.display = 'inline';
            } else {
                spHeroFoundedYear.textContent = '-';
                spHeroFounded.style.display = 'none';
            }
        }
    }

    function isOwnedProject(project) {
        if (!currentUser) return false;
        return String(project.pembuat || '').trim().toLowerCase()
            === String(currentUser.nama_user || '').trim().toLowerCase();
    }

    async function loadProjectCount() {
        const spHeroProjectCount = document.getElementById('spHeroProjectCount');
        if (!spHeroProjectCount) return;

        try {
            const response = await fetch('/api/sponsor/projects', { credentials: 'same-origin' });
            const result = await readJson(response);
            if (!response.ok) return;

            const projects = result.projects || [];
            const ownProjects = projects.some((project) => 'pembuat' in project)
                ? projects.filter(isOwnedProject)
                : projects;

            spHeroProjectCount.textContent = String(ownProjects.length);
        } catch (error) {
            console.error('Gagal memuat jumlah project:', error);
        }
    }

    checkAuth();

    // ──────────────────────────────────────────────────
    // PROFILE SUBTABS (Profil Perusahaan / Keamanan)
    // ──────────────────────────────────────────────────
    const profileSubtabs = document.querySelectorAll('.profile-subtab');
    const profileSubpanels = document.querySelectorAll('.profile-subpanel');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const topbarTitle = document.getElementById('topbarTitle');

    const subtabMeta = {
        informasi: { title: 'Pengaturan Sponsor', breadcrumb: 'Profil' },
        keamanan: { title: 'Keamanan Akun', breadcrumb: 'Keamanan' },
    };

    function switchProfileSubtab(tabName, updateHash = true) {
        profileSubtabs.forEach((tab) => {
            const active = tab.dataset.profileTab === tabName;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        profileSubpanels.forEach((panel) => {
            const active = panel.id === `profile-tab-${tabName}`;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        });

        const meta = subtabMeta[tabName];
        if (meta) {
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = meta.breadcrumb;
            if (topbarTitle) topbarTitle.textContent = meta.title;
        }

        if (updateHash) window.history.replaceState(null, '', `#${tabName === 'keamanan' ? 'keamanan' : 'perusahaan'}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    profileSubtabs.forEach((tab) => {
        tab.addEventListener('click', () => switchProfileSubtab(tab.dataset.profileTab));
    });

    const hash = window.location.hash.substring(1);
    switchProfileSubtab(hash === 'keamanan' ? 'keamanan' : 'informasi', false);

    // ──────────────────────────────────────────────────
    // Password Strength Indicator
    // ──────────────────────────────────────────────────
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

    // ──────────────────────────────────────────────────
    // GANTI PASSWORD
    // ──────────────────────────────────────────────────
    const confirmPassword = document.getElementById('confirmPassword');
    const btnUpdatePassword = document.getElementById('btnUpdatePassword');
    const passwordMessage = document.getElementById('passwordMessage');

    function showPasswordMessage(message, type) {
        if (!passwordMessage) return;
        passwordMessage.textContent = message;
        passwordMessage.className = `message ${type || ''}`.trim();
        passwordMessage.style.display = message ? 'block' : 'none';
    }

    if (btnUpdatePassword) {
        btnUpdatePassword.addEventListener('click', async () => {
            const password = newPassword?.value || '';
            const confirmation = confirmPassword?.value || '';

            if (password.length < 8) {
                showPasswordMessage('Password baru harus terdiri dari minimal 8 karakter.', 'error');
                return;
            }
            if (password !== confirmation) {
                showPasswordMessage('Konfirmasi password tidak sama.', 'error');
                return;
            }

            btnUpdatePassword.disabled = true;
            btnUpdatePassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memperbarui...';
            showPasswordMessage('', '');

            try {
                const response = await fetch('/api/sponsor/profile/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ password }),
                });

                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal memperbarui password.');

                newPassword.value = '';
                confirmPassword.value = '';
                newPassword.dispatchEvent(new Event('input'));
                showPasswordMessage('Password berhasil diperbarui.', 'success');
            } catch (error) {
                showPasswordMessage(error.message, 'error');
            } finally {
                btnUpdatePassword.disabled = false;
                btnUpdatePassword.innerHTML = '<i class="fas fa-key"></i> Perbarui Password';
            }
        });
    }

    // ──────────────────────────────────────────────────
    // DATA DIRI (user)
    // ──────────────────────────────────────────────────
    const btnSaveProfileInfo = document.getElementById('btnSaveProfileInfo');
    const profileMessage = document.getElementById('profileMessage');

    function showProfileMessage(msg, type) {
        if (!profileMessage) return;
        profileMessage.textContent = msg;
        profileMessage.className = `message ${type || ''}`.trim();
        profileMessage.style.display = msg ? 'block' : 'none';
    }

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
                const response = await fetch('/api/sponsor/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ nama_user, email, no_telp }),
                });

                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal menyimpan data diri.');

                showProfileMessage('Data diri berhasil diperbarui!', 'success');

                // Sync sidebar immediately using returned user
                if (result.user) {
                    currentUser = { ...currentUser, ...result.user };
                    syncSidebar(result.user);
                }
            } catch (err) {
                showProfileMessage(err.message, 'error');
            } finally {
                btnSaveProfileInfo.disabled = false;
                btnSaveProfileInfo.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            }
        });
    }

    // ──────────────────────────────────────────────────
    // INFORMASI USAHA (profil_usaha)
    // ──────────────────────────────────────────────────
    const btnSaveInformasiUsaha = document.getElementById('btnSaveInformasiUsaha');
    const informasiUsahaMessage = document.getElementById('informasiUsahaMessage');

    function showInformasiUsahaMessage(msg, type) {
        if (!informasiUsahaMessage) return;
        informasiUsahaMessage.textContent = msg;
        informasiUsahaMessage.className = `message ${type || ''}`.trim();
        informasiUsahaMessage.style.display = msg ? 'block' : 'none';
    }

    async function loadBusinessProfile() {
        try {
            const response = await fetch('/api/sponsor/profile', { credentials: 'same-origin' });
            const result = await readJson(response);

            if (!response.ok) throw new Error(result.message || 'Gagal memuat profil usaha.');

            const user = result.user;
            if (!user) return;
            currentUser = { ...currentUser, ...user };

            const inputNamaLengkap = document.getElementById('inputNamaLengkap');
            const inputEmail = document.getElementById('inputEmail');
            const inputNoTelp = document.getElementById('inputNoTelp');
            if (inputNamaLengkap) inputNamaLengkap.value = user.nama_user || '';
            if (inputEmail) inputEmail.value = user.email || '';
            if (inputNoTelp) inputNoTelp.value = user.no_telp || '';

            const profil = user.profil_usaha || {};

            const inputNamaUsaha = document.getElementById('inputNamaUsaha');
            const inputBidangUsaha = document.getElementById('inputBidangUsaha');
            const inputJumlahKaryawan = document.getElementById('inputJumlahKaryawan');
            const inputTahunBerdiri = document.getElementById('inputTahunBerdiri');
            const inputDeskripsiUsaha = document.getElementById('inputDeskripsiUsaha');
            const inputEmailUsaha = document.getElementById('inputEmailUsaha');
            const inputNoTlpUsaha = document.getElementById('inputNoTlpUsaha');
            const inputAlamatUsaha = document.getElementById('inputAlamatUsaha');

            if (inputNamaUsaha) inputNamaUsaha.value = profil.nama_usaha || '';
            if (inputBidangUsaha) inputBidangUsaha.value = profil.bidang_usaha || '';
            if (inputJumlahKaryawan) inputJumlahKaryawan.value = profil.jumlah_karyawan ?? '';
            if (inputTahunBerdiri) inputTahunBerdiri.value = profil.tahun_berdiri ?? '';
            if (inputDeskripsiUsaha) inputDeskripsiUsaha.value = profil.deskripsi_usaha || '';
            if (inputEmailUsaha) inputEmailUsaha.value = profil.email_usaha || '';
            if (inputNoTlpUsaha) inputNoTlpUsaha.value = profil.no_tlp_usaha || '';
            if (inputAlamatUsaha) inputAlamatUsaha.value = profil.alamat_usaha || '';

            syncHero(user);
        } catch (err) {
            showInformasiUsahaMessage(err.message, 'error');
        }
    }

    if (btnSaveInformasiUsaha) {
        btnSaveInformasiUsaha.addEventListener('click', async () => {
            const inputNamaUsaha = document.getElementById('inputNamaUsaha');
            const inputBidangUsaha = document.getElementById('inputBidangUsaha');
            const inputJumlahKaryawan = document.getElementById('inputJumlahKaryawan');
            const inputTahunBerdiri = document.getElementById('inputTahunBerdiri');
            const inputDeskripsiUsaha = document.getElementById('inputDeskripsiUsaha');
            const inputEmailUsaha = document.getElementById('inputEmailUsaha');
            const inputNoTlpUsaha = document.getElementById('inputNoTlpUsaha');
            const inputAlamatUsaha = document.getElementById('inputAlamatUsaha');

            const nama_usaha = inputNamaUsaha?.value.trim();
            const bidang_usaha = inputBidangUsaha?.value.trim();

            if (!nama_usaha || !bidang_usaha) {
                showInformasiUsahaMessage('Nama usaha dan bidang usaha wajib diisi.', 'error');
                return;
            }

            const payload = {
                nama_usaha,
                bidang_usaha,
                jumlah_karyawan: inputJumlahKaryawan?.value || '',
                tahun_berdiri: inputTahunBerdiri?.value || '',
                deskripsi_usaha: inputDeskripsiUsaha?.value.trim() || '',
                email_usaha: inputEmailUsaha?.value.trim() || '',
                no_tlp_usaha: inputNoTlpUsaha?.value.trim() || '',
                alamat_usaha: inputAlamatUsaha?.value.trim() || '',
            };

            btnSaveInformasiUsaha.disabled = true;
            btnSaveInformasiUsaha.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            showInformasiUsahaMessage('', '');

            try {
                const response = await fetch('/api/sponsor/profile/usaha', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload),
                });

                const result = await readJson(response);
                if (!response.ok) throw new Error(result.message || 'Gagal menyimpan informasi usaha.');

                showInformasiUsahaMessage('Informasi usaha berhasil diperbarui!', 'success');

                // Sync hero immediately using submitted payload
                syncHero({
                    nama_user: currentUser?.nama_user,
                    profil_usaha: payload,
                });
            } catch (err) {
                showInformasiUsahaMessage(err.message, 'error');
            } finally {
                btnSaveInformasiUsaha.disabled = false;
                btnSaveInformasiUsaha.innerHTML = '<i class="fas fa-save"></i> Simpan Profil';
            }
        });
    }

    loadBusinessProfile();
});