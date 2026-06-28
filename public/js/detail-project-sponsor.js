const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
const projectTitle = document.getElementById('projectTitle');
const projectStatus = document.getElementById('projectStatus');
const projectDescription = document.getElementById('projectDescription');
const projectMaker = document.getElementById('projectMaker');
const projectPayment = document.getElementById('projectPayment');
const projectStartDate = document.getElementById('projectStartDate');
const projectDeadline = document.getElementById('projectDeadline');
const rolesList = document.getElementById('rolesList');
const detailMessage = document.getElementById('detailMessage');
const laporanMessage = document.getElementById('laporanMessage');
const laporanTableBody = document.getElementById('laporanTableBody');

let projectId = null;

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

function getListValue(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return [];
    }

    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue : [value];
    } catch {
        return [value];
    }
}

function formatDate(value) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value));
}

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function getStatusClass(status) {
    if (status === 'pending') return 'waiting';
    if (status === 'belum dimulai') return 'pending';
    if (status === 'sedang dikerjakan') return 'progress';
    if (status === 'selesai') return 'done';
    if (status === 'ditolak') return 'rejected';
    return '';
}

function getLaporanTypeLabel(type) {
    const labels = {
        progress: 'Progress',
        problem: 'Problem',
        notice: 'Notice',
    };

    return labels[type] || type || '-';
}

async function checkAuth() {
    try {
        const response = await fetch('/api/me');
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
        projectId = Number(params.get('id'));
        if (!Number.isInteger(projectId) || projectId <= 0) {
            window.location.href = '/page/sponsor/dashboard.html';
            return;
        }

        await loadProjectDetails();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

function renderRoles(project) {
    const roles = getListValue(project.role_project);
    const freelancers = getListValue(project.nama_user);

    if (!roles.length) {
        rolesList.innerHTML = '<div class="empty-text">Belum ada role project.</div>';
        return;
    }

    rolesList.innerHTML = '';
    roles.forEach((role, index) => {
        const container = document.createElement('div');
        const leftSide = document.createElement('div');
        const roleText = document.createElement('span');
        const badge = document.createElement('span');

        container.className = 'employee-option sponsor-role-row';
        leftSide.className = 'sponsor-role-name';
        roleText.textContent = role;
        leftSide.appendChild(roleText);

        badge.className = freelancers[index] ? 'role-state filled' : 'role-state empty';
        badge.textContent = freelancers[index] ? `Diisi oleh: ${freelancers[index]}` : 'Belum diisi';

        container.append(leftSide, badge);
        rolesList.appendChild(container);
    });
}

async function loadProjectDetails() {
    setMessage(detailMessage, 'Memuat detail project...');

    try {
        const response = await fetch(`/api/sponsor/projects/${projectId}`);
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat detail project.');
        }

        const project = result.project;
        projectTitle.textContent = project.nama_project;
        projectStatus.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        projectStatus.textContent = project.status_project;
        projectDescription.textContent = project.deskripsi_project || 'Tidak ada deskripsi.';
        projectMaker.value = project.pembuat || '-';
        projectPayment.value = formatRupiah(project.bayaran);
        projectStartDate.value = formatDate(project.tgl_mulai);
        projectDeadline.value = formatDate(project.deadline);

        renderRoles(project);
        await loadProjectLaporan();
        setMessage(detailMessage, '');
    } catch (error) {
        console.error(error);
        setMessage(detailMessage, error.message, 'error');
    }
}

async function loadProjectLaporan() {
    setMessage(laporanMessage, 'Memuat laporan project...');
    laporanTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Memuat laporan project...</td></tr>';

    try {
        const response = await fetch(`/api/sponsor/projects/${projectId}/laporan`);
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat laporan project.');
        }

        const laporan = result.laporan || [];
        if (!laporan.length) {
            laporanTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Belum ada laporan untuk project ini.</td></tr>';
            setMessage(laporanMessage, '');
            return;
        }

        laporanTableBody.innerHTML = '';
        laporan.forEach((item) => {
            const row = document.createElement('tr');
            const idCell = document.createElement('td');
            const userCell = document.createElement('td');
            const roleCell = document.createElement('td');
            const typeCell = document.createElement('td');
            const descriptionCell = document.createElement('td');
            const proofCell = document.createElement('td');
            const proofLink = document.createElement('a');

            idCell.textContent = item.id_laporan;
            userCell.textContent = item.nama_user;
            roleCell.textContent = item.role_project;
            typeCell.textContent = getLaporanTypeLabel(item.jenis_laporan);
            descriptionCell.textContent = item.deskripsi_laporan;

            proofLink.className = 'link-btn';
            proofLink.href = item.bukti;
            proofLink.target = '_blank';
            proofLink.rel = 'noopener noreferrer';
            proofLink.innerHTML = '<i class="fas fa-eye"></i> Lihat';
            proofCell.appendChild(proofLink);

            row.append(idCell, userCell, roleCell, typeCell, descriptionCell, proofCell);
            laporanTableBody.appendChild(row);
        });

        setMessage(laporanMessage, '');
    } catch (error) {
        console.error(error);
        laporanTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Laporan gagal dimuat.</td></tr>';
        setMessage(laporanMessage, error.message, 'error');
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

checkAuth();
