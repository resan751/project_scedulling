const pageMessage = document.getElementById('pageMessage');
const heroAvatar = document.getElementById('heroAvatar');
const heroName = document.getElementById('heroName');
const heroTagline = document.getElementById('heroTagline');
const heroProjectCount = document.getElementById('heroProjectCount');

const inputNamaLengkap = document.getElementById('inputNamaLengkap');
const inputEmail = document.getElementById('inputEmail');
const inputNoTelp = document.getElementById('inputNoTelp');
const inputHeadline = document.getElementById('inputHeadline');
const inputBio = document.getElementById('inputBio');
const inputLinkedin = document.getElementById('inputLinkedin');

const cvMessage = document.getElementById('cvMessage');
const cvHasFile = document.getElementById('cvHasFile');
const cvNoFile = document.getElementById('cvNoFile');
const cvLoading = document.getElementById('cvLoading');
const cvFileName = document.getElementById('cvFileName');
const cvLinkView = document.getElementById('cvLinkView');
const cvLinkDownload = document.getElementById('cvLinkDownload');

const btnBack = document.getElementById('btnBack');
const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');

let freelanceUserId = null;

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

function getCvFileName(cvPath) {
    if (!cvPath) return '-';
    const parts = String(cvPath).split('/');
    return parts[parts.length - 1] || 'CV';
}

function renderCv(user) {
    cvLoading.style.display = 'none';

    if (user.cv) {
        cvHasFile.style.display = 'flex';
        cvNoFile.style.display = 'none';
        cvFileName.textContent = getCvFileName(user.cv);
        cvLinkView.href = user.cv;
        cvLinkDownload.href = user.cv;
    } else {
        cvHasFile.style.display = 'none';
        cvNoFile.style.display = 'flex';
    }

    setMessage(cvMessage, '');
}

function renderProfile(user, completedProjectCount) {
    const profil = user.profil_freelance || {};

    heroAvatar.textContent = getInitials(user.nama_user);
    heroName.textContent = user.nama_user || '-';
    heroTagline.textContent = profil.headline || 'Belum ada headline';
    heroProjectCount.textContent = completedProjectCount ?? 0;

    inputNamaLengkap.value = user.nama_user || '-';
    inputEmail.value = user.email || '-';
    inputNoTelp.value = user.no_telp || '-';

    inputHeadline.value = profil.headline || '-';
    inputBio.value = profil.bio || '-';
    inputLinkedin.value = profil.linkedin || '-';

    renderCv(user);
}

async function checkAuthAndLoad() {
    try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        const result = await response.json();
        if (result.user?.role !== 'sponsor') {
            window.location.href = '/login.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        freelanceUserId = Number(params.get('userId'));
        if (!Number.isInteger(freelanceUserId) || freelanceUserId <= 0) {
            window.location.href = '/page/sponsor/dashboard.html';
            return;
        }

        await loadFreelanceProfile();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

async function loadFreelanceProfile() {
    setMessage(pageMessage, 'Memuat profil freelance...');

    try {
        const response = await fetch(`/api/sponsor/freelance/${freelanceUserId}/profile`, { credentials: 'same-origin' });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat profil freelance.');
        }

        renderProfile(result.user, result.completedProjectCount);
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
            window.location.href = '/page/sponsor/dashboard.html';
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