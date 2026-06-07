const logoutBtn = document.getElementById('logoutBtn');
const userWelcome = document.getElementById('userWelcome');
const availableTableBody = document.getElementById('availableTableBody');
const availableMessage = document.getElementById('availableMessage');
const registeredTableBody = document.getElementById('registeredTableBody');
const registeredMessage = document.getElementById('registeredMessage');
const availableProjectCount = document.getElementById('availableProjectCount');
const registeredProjectCount = document.getElementById('registeredProjectCount');

let currentUser = null;
let projectsData = [];

async function readJson(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return { message: 'Server mengirim response yang tidak valid.' };
}

function setMessage(element, message, type = '') {
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

function getStatusClass(status) {
    if (status === 'pending') return 'waiting';
    if (status === 'belum dimulai') return 'pending';
    if (status === 'sedang dikerjakan') return 'progress';
    if (status === 'selesai') return 'done';
    if (status === 'ditolak') return 'rejected';
    return '';
}

async function checkAuth() {
    try {
        const response = await fetch('/api/me');
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
        userWelcome.textContent = `Halo, ${currentUser.nama_user}`;
        loadProjects();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

function renderAvailableProjects(projects) {
    const available = projects.filter((project) => {
        if (project.status_project !== 'pending') return false;
        
        // Check if there is at least one vacant role
        const freelancers = project.nama_user || [];
        const roles = project.role_project || [];
        return roles.some((_, index) => !freelancers[index]);
    });

    availableProjectCount.textContent = available.length;

    if (!available.length) {
        availableTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Belum ada project tersedia untuk didaftar.</td></tr>';
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
        const vacantRoles = (project.role_project || []).filter((_, index) => !(project.nama_user || [])[index]);
        rolesCell.textContent = vacantRoles.join(', ');

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
        detailLink.textContent = 'Detail & Daftar';
        actionCell.appendChild(detailLink);

        row.append(idCell, nameCell, rolesCell, startCell, deadlineCell, actionCell);
        availableTableBody.appendChild(row);
    });
}

function renderRegisteredProjects(projects) {
    const registered = projects.filter((project) => {
        const freelancers = project.nama_user || [];
        return freelancers.includes(currentUser.nama_user);
    });

    registeredProjectCount.textContent = registered.length;

    if (!registered.length) {
        registeredTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Anda belum mengikuti project apa pun.</td></tr>';
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
        (project.nama_user || []).forEach((user, index) => {
            if (user === currentUser.nama_user) {
                myRoles.push((project.role_project || [])[index]);
            }
        });
        rolesCell.textContent = myRoles.join(', ');

        const startCell = document.createElement('td');
        startCell.textContent = formatDate(project.tgl_mulai);

        const deadlineCell = document.createElement('td');
        deadlineCell.textContent = formatDate(project.deadline);

        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        row.append(idCell, nameCell, rolesCell, startCell, deadlineCell, statusCell);
        registeredTableBody.appendChild(row);
    });
}

async function loadProjects() {
    setMessage(availableMessage, 'Memuat data project...');
    setMessage(registeredMessage, 'Memuat data project...');

    try {
        const response = await fetch('/api/freelance/projects');
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
        availableTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Data gagal dimuat.</td></tr>';
        registeredTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">Data gagal dimuat.</td></tr>';
        setMessage(availableMessage, error.message, 'error');
        setMessage(registeredMessage, error.message, 'error');
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

checkAuth();
