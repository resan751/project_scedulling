const userTableBody = document.getElementById('userTableBody');
const projectTableBody = document.getElementById('projectTableBody');
const tableMessage = document.getElementById('tableMessage');
const projectMessage = document.getElementById('projectMessage');
const logoutBtn = document.getElementById('logoutBtn');

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
}

function formatDate(value) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function getStatusClass(status) {
    if (status === 'menunggu approve') return 'waiting';
    if (status === 'belum dimulai') return 'pending';
    if (status === 'sedang dikerjakan') return 'progress';
    if (status === 'selesai') return 'done';
    return '';
}

function getEmployeeNames(value) {
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

function renderEmployeeToggle(project, employeeCell) {
    const employeeNames = getEmployeeNames(project.nama_karyawan);
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const list = document.createElement('ul');

    details.className = 'employee-details';
    summary.textContent = `${employeeNames.length} karyawan`;
    list.className = 'employee-name-list';

    employeeNames.forEach((name) => {
        const item = document.createElement('li');
        item.textContent = name;
        list.appendChild(item);
    });

    details.append(summary, list);
    employeeCell.appendChild(details);
}

function renderUsers(users) {
    if (!users.length) {
        userTableBody.innerHTML = '<tr><td colspan="5">Belum ada data karyawan.</td></tr>';
        return;
    }

    userTableBody.innerHTML = '';

    users.forEach((user) => {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        const nameCell = document.createElement('td');
        const emailCell = document.createElement('td');
        const roleCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const roleBadge = document.createElement('span');
        const rowActions = document.createElement('div');
        const updateLink = document.createElement('a');
        const deleteButton = document.createElement('button');

        idCell.textContent = user.id_user;
        nameCell.textContent = user.nama_karyawan;
        emailCell.textContent = user.email;
        roleBadge.className = 'role-badge';
        roleBadge.textContent = user.role;
        roleCell.appendChild(roleBadge);

        rowActions.className = 'row-actions';
        updateLink.className = 'action-btn update-btn';
        updateLink.href = `/page/manager/user-update.html?id=${user.id_user}`;
        updateLink.textContent = 'Update';

        deleteButton.className = 'action-btn delete-btn';
        deleteButton.type = 'button';
        deleteButton.dataset.id = user.id_user;
        deleteButton.dataset.name = user.nama_karyawan;
        deleteButton.textContent = 'Delete';

        rowActions.append(updateLink, deleteButton);
        actionCell.appendChild(rowActions);
        row.append(idCell, nameCell, emailCell, roleCell, actionCell);
        userTableBody.appendChild(row);
    });
}

function renderProjectAction(project, actionCell) {
    const rowActions = document.createElement('div');
    rowActions.className = 'row-actions';

    if (project.status_project === 'menunggu approve') {
        const approveButton = document.createElement('button');
        approveButton.className = 'action-btn approve-btn';
        approveButton.type = 'button';
        approveButton.dataset.id = project.id_project;
        approveButton.dataset.name = project.nama_project;
        approveButton.textContent = 'Approve';
        rowActions.appendChild(approveButton);
    } else if (project.status_project === 'sedang dikerjakan') {
        const finishButton = document.createElement('button');
        finishButton.className = 'action-btn finish-btn';
        finishButton.type = 'button';
        finishButton.dataset.id = project.id_project;
        finishButton.dataset.name = project.nama_project;
        finishButton.textContent = 'Selesai';
        rowActions.appendChild(finishButton);
    } else {
        const text = document.createElement('span');
        text.className = 'disabled-text';
        text.textContent = '-';
        rowActions.appendChild(text);
    }

    actionCell.appendChild(rowActions);
}

function renderProjects(projects) {
    if (!projects.length) {
        projectTableBody.innerHTML = '<tr><td colspan="7">Belum ada data project.</td></tr>';
        return;
    }

    projectTableBody.innerHTML = '';

    projects.forEach((project) => {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        const projectCell = document.createElement('td');
        const employeeCell = document.createElement('td');
        const startCell = document.createElement('td');
        const deadlineCell = document.createElement('td');
        const statusCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const statusBadge = document.createElement('span');

        idCell.textContent = project.id_project;
        projectCell.textContent = project.nama_project;
        renderEmployeeToggle(project, employeeCell);
        startCell.textContent = formatDate(project.tgl_mulai);
        deadlineCell.textContent = formatDate(project.deadline);
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        renderProjectAction(project, actionCell);
        row.append(idCell, projectCell, employeeCell, startCell, deadlineCell, statusCell, actionCell);
        projectTableBody.appendChild(row);
    });
}

async function loadUsers() {
    setMessage(tableMessage, 'Memuat data karyawan...');

    try {
        const response = await fetch('/api/users');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data karyawan gagal dimuat.');
        }

        renderUsers(result.users || []);
        setMessage(tableMessage, '');
    } catch (error) {
        userTableBody.innerHTML = '<tr><td colspan="5">Data gagal dimuat.</td></tr>';
        setMessage(tableMessage, error.message, 'error');
    }
}

async function loadProjects() {
    setMessage(projectMessage, 'Memuat data project...');

    try {
        const response = await fetch('/api/manager/projects');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data project gagal dimuat.');
        }

        renderProjects(result.projects || []);
        setMessage(projectMessage, '');
    } catch (error) {
        projectTableBody.innerHTML = '<tr><td colspan="7">Data gagal dimuat.</td></tr>';
        setMessage(projectMessage, error.message, 'error');
    }
}

userTableBody.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.delete-btn');
    if (!deleteButton) return;

    const id = deleteButton.dataset.id;
    const name = deleteButton.dataset.name;
    const confirmed = confirm(`Hapus data karyawan "${name}"?`);
    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.textContent = 'Menghapus...';

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
        });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'User gagal dihapus.');
        }

        setMessage(tableMessage, result.message, 'success');
        await loadUsers();
    } catch (error) {
        setMessage(tableMessage, error.message, 'error');
        deleteButton.disabled = false;
        deleteButton.textContent = 'Delete';
    }
});

projectTableBody.addEventListener('click', async (event) => {
    const approveButton = event.target.closest('.approve-btn');
    const finishButton = event.target.closest('.finish-btn');
    const actionButton = approveButton || finishButton;
    if (!actionButton) return;

    const isApprove = Boolean(approveButton);
    const id = actionButton.dataset.id;
    const name = actionButton.dataset.name;
    const confirmed = confirm(isApprove
        ? `Approve project "${name}"?`
        : `Ubah project "${name}" menjadi selesai?`);
    if (!confirmed) return;

    actionButton.disabled = true;
    actionButton.textContent = isApprove ? 'Approve...' : 'Menyimpan...';

    try {
        const response = await fetch(`/api/manager/projects/${id}/${isApprove ? 'approve' : 'finish'}`, {
            method: 'PUT',
        });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Status project gagal diubah.');
        }

        setMessage(projectMessage, result.message, 'success');
        await loadProjects();
    } catch (error) {
        setMessage(projectMessage, error.message, 'error');
        actionButton.disabled = false;
        actionButton.textContent = isApprove ? 'Approve' : 'Selesai';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

loadUsers();
loadProjects();
