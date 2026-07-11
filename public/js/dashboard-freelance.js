const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
const userWelcome = document.getElementById('userWelcome');
const availableTableBody = document.getElementById('availableTableBody');
const availableMessage = document.getElementById('availableMessage');
const registeredTableBody = document.getElementById('registeredTableBody');
const registeredMessage = document.getElementById('registeredMessage');
const availableProjectCount = document.getElementById('availableProjectCount');
const registeredProjectCount = document.getElementById('registeredProjectCount');
const cvMenuItem = document.getElementById('cvMenuItem');
const cvPanel = document.getElementById('cvPanel');
const cvInput = document.getElementById('cvInput');
const btnUploadCv = document.getElementById('btnUploadCv');
const btnChangeCv = document.getElementById('btnChangeCv');
const btnSubmitCv = document.getElementById('btnSubmitCv');
const cvFileName = document.getElementById('cvFileName');
const cvStatusText = document.getElementById('cvStatusText');
const cvLink = document.getElementById('cvLink');
const cvMessage = document.getElementById('cvMessage');

let currentUser = null;
let projectsData = [];
let selectedCvFile = null;

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
    if (!message) {
        element.style.display = 'none';
    } else {
        element.style.display = 'block';
    }
}

function formatDate(value) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
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

function showCvPanel() {
    if (cvPanel) {
        cvPanel.style.display = 'block';
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        const result = await response.json();
        currentUser = result.user;
        if (currentUser.role !== 'freelance') {
            window.location.href = '/login.html';
            return;
        }
        if (userWelcome) {
            userWelcome.textContent = `Halo, ${currentUser.nama_user}. Temukan project baru dan kelola peran Anda dalam tim`;
        }
        await loadFreelanceProfile();
        loadProjects();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

function renderAvailableProjects(projects) {
    const available = projects;

    if (availableProjectCount) {
        availableProjectCount.textContent = available.length;
    }

    if (!available.length) {
        availableTableBody.innerHTML = '<tr><td colspan="7" class="empty-text">Belum ada project tersedia untuk didaftar.</td></tr>';
        return;
    }

    availableTableBody.innerHTML = '';
    available.forEach((project) => {
        const row = document.createElement('tr');

        const idCell = document.createElement('td');
        idCell.textContent = project.id_project;

        const nameCell = document.createElement('td');
        nameCell.textContent = project.nama_project;

        const rolesCell = document.createElement('td');
        const vacantRoles = (project.role_project || []).filter((_, index) => !(project.id_user || [])[index]);
        rolesCell.textContent = vacantRoles.length ? vacantRoles.join(', ') : 'Tidak ada role kosong';

        const paymentCell = document.createElement('td');
        paymentCell.textContent = formatRupiah(project.bayaran);

        const startCell = document.createElement('td');
        startCell.textContent = formatDate(project.tgl_mulai);

        const deadlineCell = document.createElement('td');
        deadlineCell.textContent = formatDate(project.deadline);

        const actionCell = document.createElement('td');
        const detailLink = document.createElement('a');
        detailLink.className = 'link-btn';
        detailLink.style.padding = '6px 12px';
        detailLink.style.fontSize = '12px';
        detailLink.href = `/page/freelance/detail-project.html?id=${project.id_project}`;
        detailLink.innerHTML = '<i class="fas fa-eye"></i> Detail';
        actionCell.appendChild(detailLink);

        row.append(idCell, nameCell, rolesCell, paymentCell, startCell, deadlineCell, actionCell);
        availableTableBody.appendChild(row);
    });
}

function renderRegisteredProjects(projects) {
    const registered = projects.filter((project) => {
        const freelancerIds = project.id_user || [];
        return freelancerIds.some((id) => String(id) === String(currentUser.id_user));
    });

    if (registeredProjectCount) {
        registeredProjectCount.textContent = registered.length;
    }

    if (!registered.length) {
        registeredTableBody.innerHTML = '<tr><td colspan="8" class="empty-text">Anda belum mengikuti project apa pun.</td></tr>';
        return;
    }

    registeredTableBody.innerHTML = '';
    registered.forEach((project) => {
        const row = document.createElement('tr');

        const idCell = document.createElement('td');
        idCell.textContent = project.id_project;

        const nameCell = document.createElement('td');
        nameCell.textContent = project.nama_project;

        const rolesCell = document.createElement('td');
        const myRoles = [];
        (project.id_user || []).forEach((id, index) => {
            if (String(id) === String(currentUser.id_user)) {
                myRoles.push((project.role_project || [])[index]);
            }
        });
        rolesCell.textContent = myRoles.join(', ');

        const paymentCell = document.createElement('td');
        paymentCell.textContent = formatRupiah(project.bayaran);

        const startCell = document.createElement('td');
        startCell.textContent = formatDate(project.tgl_mulai);

        const deadlineCell = document.createElement('td');
        deadlineCell.textContent = formatDate(project.deadline);

        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement('td');
        const detailLink = document.createElement('a');
        detailLink.className = 'link-btn';
        detailLink.style.padding = '6px 12px';
        detailLink.style.fontSize = '12px';
        detailLink.href = `/page/freelance/detail-project.html?id=${project.id_project}`;
        detailLink.innerHTML = '<i class="fas fa-eye"></i> Detail';
        actionCell.appendChild(detailLink);

        row.append(idCell, nameCell, rolesCell, paymentCell, startCell, deadlineCell, statusCell, actionCell);
        registeredTableBody.appendChild(row);
    });
}

async function loadProjects() {
    setMessage(availableMessage, 'Memuat data project...');
    setMessage(registeredMessage, 'Memuat data project...');

    try {
        const response = await fetch('/api/freelance/projects', { credentials: 'same-origin' });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data project gagal dimuat.');
        }

        projectsData = result.projects || [];
        renderAvailableProjects(projectsData);
        renderRegisteredProjects(projectsData);

        setMessage(availableMessage, '');
        setMessage(registeredMessage, '');
    } catch (error) {
        availableTableBody.innerHTML = '<tr><td colspan="7" class="empty-text">Data gagal dimuat.</td></tr>';
        registeredTableBody.innerHTML = '<tr><td colspan="8" class="empty-text">Data gagal dimuat.</td></tr>';
        setMessage(availableMessage, error.message, 'error');
        setMessage(registeredMessage, error.message, 'error');
    }
}

async function loadFreelanceProfile() {
    if (!cvStatusText) return;

    try {
        const response = await fetch('/api/freelance/profile', { credentials: 'same-origin' });
        const result = await readJson(response);
        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat profil CV.');
        }

        const user = result.user;
        if (!user) {
            throw new Error('Profil freelance tidak ditemukan.');
        }

        currentUser = user;
        const hasCv = Boolean(user.cv);

        if (cvStatusText) {
            cvStatusText.textContent = hasCv ? 'CV Anda sudah terunggah.' : 'Belum ada CV yang diunggah.';
        }

        if (cvMenuItem) {
            cvMenuItem.innerHTML = `<i class="fas fa-file-alt"></i> ${hasCv ? 'Lihat CV Saya' : 'Unggah CV'}`;
        }

        if (cvLink) {
            if (hasCv) {
                cvLink.href = user.cv;
                cvLink.style.display = 'inline-flex';
            } else {
                cvLink.style.display = 'none';
            }
        }

        if (btnChangeCv) {
            btnChangeCv.style.display = hasCv ? 'inline-block' : 'none';
        }

        if (btnUploadCv) {
            btnUploadCv.style.display = hasCv ? 'none' : 'inline-block';
        }

        if (btnSubmitCv) {
            btnSubmitCv.style.display = selectedCvFile ? 'inline-block' : 'none';
            btnSubmitCv.disabled = !selectedCvFile;
            btnSubmitCv.textContent = hasCv ? 'Ganti CV' : 'Unggah CV';
        }

        if (cvFileName) {
            cvFileName.textContent = selectedCvFile ? selectedCvFile.name : '';
        }
    } catch (error) {
        console.error(error);
        setMessage(cvMessage, error.message, 'error');
        if (cvStatusText) {
            cvStatusText.textContent = 'Gagal memuat status CV.';
        }
    }
}

if (btnUploadCv && cvInput) {
    btnUploadCv.addEventListener('click', () => {
        if (cvInput) cvInput.click();
    });
}

if (btnChangeCv && cvInput) {
    btnChangeCv.addEventListener('click', () => {
        if (cvInput) cvInput.click();
    });
}

if (cvInput) {
    cvInput.addEventListener('change', () => {
        selectedCvFile = cvInput.files?.[0] || null;
        if (cvFileName) {
            cvFileName.textContent = selectedCvFile ? selectedCvFile.name : '';
        }
        if (btnSubmitCv) {
            btnSubmitCv.style.display = selectedCvFile ? 'inline-block' : 'none';
            btnSubmitCv.disabled = !selectedCvFile;
        }
        setMessage(cvMessage, '');
    });
}

if (btnSubmitCv) {
    btnSubmitCv.addEventListener('click', async () => {
        if (!selectedCvFile) {
            setMessage(cvMessage, 'Pilih file CV terlebih dahulu.', 'error');
            return;
        }

        btnSubmitCv.disabled = true;
        btnSubmitCv.textContent = currentUser?.cv ? 'Mengganti...' : 'Mengunggah...';
        setMessage(cvMessage, '');

        try {
            const formData = new FormData();
            formData.append('cv', selectedCvFile);

            const response = await fetch('/api/freelance/profile/cv', {
                method: 'POST',
                credentials: 'same-origin',
                body: formData,
            });
            const result = await readJson(response);
            if (!response.ok) {
                throw new Error(result.message || 'Gagal mengunggah CV.');
            }

            setMessage(cvMessage, 'CV berhasil diunggah.', 'success');
            selectedCvFile = null;
            if (cvInput) cvInput.value = '';
            if (cvFileName) cvFileName.textContent = '';
            if (btnSubmitCv) {
                btnSubmitCv.style.display = 'none';
            }
            await loadFreelanceProfile();
            showCvPanel();
        } catch (error) {
            console.error(error);
            setMessage(cvMessage, error.message, 'error');
        } finally {
            if (btnSubmitCv) {
                btnSubmitCv.disabled = !selectedCvFile;
                btnSubmitCv.textContent = currentUser?.cv ? 'Ganti CV' : 'Unggah CV';
            }
        }
    });
}

if (cvMenuItem) {
    cvMenuItem.addEventListener('click', async (event) => {
        event.preventDefault();
        await loadFreelanceProfile();
        if (currentUser?.cv) {
            window.open(currentUser.cv, '_blank');
        }
        showCvPanel();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        } finally {
            window.location.href = '/login.html';
        }
    });
}

checkAuth();
