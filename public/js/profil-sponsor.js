const pageMessage = document.getElementById('pageMessage');
const heroAvatar = document.getElementById('heroAvatar');
const heroName = document.getElementById('heroName');
const heroTagline = document.getElementById('heroTagline');
const heroProjectCount = document.getElementById('heroProjectCount');

const inputNamaLengkap = document.getElementById('inputNamaLengkap');
const inputEmail = document.getElementById('inputEmail');
const inputNoTelp = document.getElementById('inputNoTelp');

const inputNamaUsaha = document.getElementById('inputNamaUsaha');
const inputBidangUsaha = document.getElementById('inputBidangUsaha');
const inputTahunBerdiri = document.getElementById('inputTahunBerdiri');
const inputEmailUsaha = document.getElementById('inputEmailUsaha');
const inputNoTlpUsaha = document.getElementById('inputNoTlpUsaha');
const inputJumlahKaryawan = document.getElementById('inputJumlahKaryawan');
const inputAlamatUsaha = document.getElementById('inputAlamatUsaha');
const inputDeskripsiUsaha = document.getElementById('inputDeskripsiUsaha');

const btnBack = document.getElementById('btnBack');
const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');

let sponsorUserId = null;

async function readJson(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return { message: 'Server mengirim response yang tidak valid.' };
}

function setMessage(element, message, type = '') {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`.trim();
    element.style.display = message ? 'block' : 'none';
}

function getInitials(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return '--';

    const parts = trimmed.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]).join('');
    return initials.toUpperCase() || '--';
}

function renderProfile(user, projectCount) {
    const usaha = user.profil_usaha || {};

    heroAvatar.textContent = getInitials(user.nama_user);
    heroName.textContent = user.nama_user || '-';
    heroTagline.textContent = usaha.nama_usaha
        ? `${usaha.nama_usaha}${usaha.bidang_usaha ? ' · ' + usaha.bidang_usaha : ''}`
        : 'Belum ada informasi usaha';
    heroProjectCount.textContent = projectCount ?? 0;

    inputNamaLengkap.value = user.nama_user || '-';
    inputEmail.value = user.email || '-';
    inputNoTelp.value = user.no_telp || '-';

    inputNamaUsaha.value = usaha.nama_usaha || '-';
    inputBidangUsaha.value = usaha.bidang_usaha || '-';
    inputTahunBerdiri.value = usaha.tahun_berdiri != null ? String(usaha.tahun_berdiri) : '-';
    inputEmailUsaha.value = usaha.email_usaha || '-';
    inputNoTlpUsaha.value = usaha.no_tlp_usaha || '-';
    inputJumlahKaryawan.value = usaha.jumlah_karyawan != null ? String(usaha.jumlah_karyawan) + ' orang' : '-';
    inputAlamatUsaha.value = usaha.alamat_usaha || '-';
    inputDeskripsiUsaha.value = usaha.deskripsi_usaha || '-';
}

async function checkAuthAndLoad() {
    try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        const result = await response.json();
        if (result.user?.role !== 'freelance') {
            window.location.href = '/login.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        sponsorUserId = Number(params.get('sponsorId'));
        if (!Number.isInteger(sponsorUserId) || sponsorUserId <= 0) {
            window.location.href = '/page/freelance/dashboard.html';
            return;
        }

        await loadSponsorProfile();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

async function loadSponsorProfile() {
    setMessage(pageMessage, 'Memuat profil sponsor...');

    try {
        const response = await fetch(`/api/freelance/sponsor/${sponsorUserId}/profile`, { credentials: 'same-origin' });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat profil sponsor.');
        }

        renderProfile(result.user, result.projectCount);
        setMessage(pageMessage, '');
    } catch (error) {
        console.error(error);
        setMessage(pageMessage, error.message, 'error');
    }
}

if (btnBack) {
    btnBack.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/page/freelance/dashboard.html';
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        window.location.href = '/login.html';
    });
}

checkAuthAndLoad();
