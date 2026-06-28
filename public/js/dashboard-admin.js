const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
const calendarDays = document.getElementById('calendarDays');
const calendarCurrent = document.getElementById('calendarCurrent');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const userTableBody = document.getElementById('userTableBody');
const userMessage = document.getElementById('userMessage');
const projectTableBody = document.getElementById('projectTableBody');
const projectMessage = document.getElementById('projectMessage');
const myProjectTableBody = document.getElementById('myProjectTableBody');
const myProjectMessage = document.getElementById('myProjectMessage');
const totalProjectCount = document.getElementById('totalProjectCount');
const totalAdminCount = document.getElementById('totalAdminCount');
const pendingProjectCount = document.getElementById('pendingProjectCount');
const totalFreelanceCount = document.getElementById('totalFreelanceCount');
const finishedProjectCount = document.getElementById('finishedProjectCount');
const editProjectModal = document.getElementById('editProjectModal');
const editProjectForm = document.getElementById('editProjectForm');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const editProjectId = document.getElementById('editProjectId');
const editNamaProject = document.getElementById('editNamaProject');
const editPembuat = document.getElementById('editPembuat');
const editBayaran = document.getElementById('editBayaran');
const editEmployeeList = document.getElementById('editEmployeeList');
const addEditRoleProjectBtn = document.getElementById('addEditRoleProjectBtn');
const editTanggalMulai = document.getElementById('editTanggalMulai');
const editDeadline = document.getElementById('editDeadline');
const editDeskripsi = document.getElementById('editDeskripsi');
const editProjectMessage = document.getElementById('editProjectMessage');
const isSponsorArea = window.location.pathname.includes('/sponsor/');
const projectApiBase = isSponsorArea ? '/api/sponsor/projects' : '/api/admin/projects';
const projectUsersApi = isSponsorArea ? '/api/sponsor/users' : '/api/admin/users';
let currentUser = null;

const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
];

const today = new Date();
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let visibleMonth = today.getMonth();
let visibleYear = today.getFullYear();
let projectsData = [];

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
}

function formatDate(value) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function formatDateInput(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

function isProjectWaitingForRoles(project) {
    const roles = getListValue(project.role_project);
    const freelancerIds = getListValue(project.id_user);

    return roles.length > 0 && roles.some((_, index) => !String(freelancerIds[index] || '').trim());
}

function isOwnedProject(project) {
    return String(project.pembuat || '').trim() === String(currentUser?.nama_user || '').trim();
}

function renderProjectSummary(projects, users = []) {
    if (!totalProjectCount || !pendingProjectCount || !totalFreelanceCount || !finishedProjectCount) {
        return;
    }

    const pendingProjects = projects.filter(isProjectWaitingForRoles).length;
    const totalFreelancers = users.filter((user) => user.role === 'freelance').length;
    const finishedProjects = projects.filter((project) => project.status_project === 'selesai').length;

    totalProjectCount.textContent = projects.length;
    pendingProjectCount.textContent = pendingProjects;
    totalFreelanceCount.textContent = totalFreelancers;
    finishedProjectCount.textContent = finishedProjects;
}

function renderUserSummary(users) {
    if (totalAdminCount) {
        totalAdminCount.textContent = users.filter((user) => user.role === 'admin').length;
    }

    if (totalFreelanceCount && !totalProjectCount) {
        totalFreelanceCount.textContent = users.filter((user) => user.role === 'freelance').length;
    }
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

function createRoleProjectInput(container, value = '', removable = true) {
    const row = document.createElement('div');
    const input = document.createElement('input');

    row.className = `role-project-row${removable ? ' can-remove' : ''}`;
    input.type = 'text';
    input.name = 'role_project';
    input.className = 'field-input';
    input.placeholder = 'Contoh: backend';
    input.required = true;
    input.value = value;
    row.appendChild(input);

    if (removable) {
        const removeButton = document.createElement('button');
        removeButton.className = 'role-remove-btn';
        removeButton.type = 'button';
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        removeButton.setAttribute('aria-label', 'Hapus role project');
        removeButton.addEventListener('click', () => {
            row.remove();
        });
        row.appendChild(removeButton);
    }

    container.appendChild(row);
    return input;
}

function buildRoleProjectInputs(selectedRoles = []) {
    const roles = selectedRoles.length ? selectedRoles : [''];

    editEmployeeList.innerHTML = '';
    roles.forEach((role, index) => {
        createRoleProjectInput(editEmployeeList, role, index > 0);
    });
}

function renderRoleProjectToggle(project, employeeCell) {
    const roleNames = getListValue(project.role_project);
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const list = document.createElement('ul');

    details.className = 'employee-details';
    summary.textContent = `${roleNames.length} role`;
    list.className = 'employee-name-list';

    roleNames.forEach((name) => {
        const item = document.createElement('li');
        item.textContent = name;
        list.appendChild(item);
    });

    details.append(summary, list);
    employeeCell.appendChild(details);
}

function renderUsers(users) {
    if (!users.length) {
        userTableBody.innerHTML = '<tr><td colspan="5">Belum ada data user.</td></tr>';
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
        nameCell.textContent = user.nama_user;
        emailCell.textContent = user.email;
        roleBadge.className = 'role-badge';
        roleBadge.textContent = user.role;
        roleCell.appendChild(roleBadge);

        rowActions.className = 'row-actions';
        actionCell.className = 'action-cell';
        updateLink.className = 'action-btn update';
        updateLink.href = `/page/admin/user-update.html?id=${user.id_user}`;
        updateLink.title = 'Update user';
        updateLink.setAttribute('aria-label', `Update user ${user.nama_user}`);
        updateLink.innerHTML = '<i class="fas fa-pen"></i><span>Update</span>';

        deleteButton.className = 'action-btn delete user-delete-btn';
        deleteButton.type = 'button';
        deleteButton.dataset.id = user.id_user;
        deleteButton.dataset.name = user.nama_user;
        deleteButton.title = 'Hapus user';
        deleteButton.setAttribute('aria-label', `Hapus user ${user.nama_user}`);
        deleteButton.innerHTML = '<i class="fas fa-trash"></i><span>Hapus</span>';

        rowActions.append(updateLink, deleteButton);
        actionCell.appendChild(rowActions);
        row.append(idCell, nameCell, emailCell, roleCell, actionCell);
        userTableBody.appendChild(row);
    });
}

function openEditProjectModal(project) {
    editProjectId.value = project.id_project;
    editNamaProject.value = project.nama_project;
    editPembuat.value = project.pembuat || '-';
    editBayaran.value = project.bayaran ?? 0;
    editTanggalMulai.value = formatDateInput(project.tgl_mulai);
    editDeadline.value = formatDateInput(project.deadline);
    editDeskripsi.value = project.deskripsi_project || '';
    buildRoleProjectInputs(getListValue(project.role_project));
    setMessage(editProjectMessage, '');
    editProjectModal.hidden = false;
    editNamaProject.focus();
}

function closeEditProjectModal() {
    editProjectModal.hidden = true;
    editProjectForm.reset();
    setMessage(editProjectMessage, '');
}

function showEditValidationMessage() {
    setMessage(editProjectMessage, 'Lengkapi semua field wajib sebelum menyimpan perubahan project.', 'error');
}

async function deleteProject(project) {
    const shouldDelete = confirm(`Hapus project "${project.nama_project}"?`);
    if (!shouldDelete) {
        return;
    }

    setMessage(projectMessage, 'Menghapus project...');

    try {
        const response = await fetch(`${projectApiBase}/${project.id_project}`, {
            method: 'DELETE',
        });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Project gagal dihapus.');
        }

        await loadProjects(result.message || 'Project berhasil dihapus.', 'success');
    } catch (error) {
        setMessage(projectMessage, error.message, 'error');
    }
}

function renderProjects(projects, targetTableBody = projectTableBody) {
    if (!targetTableBody) return;

    if (!projects.length) {
        targetTableBody.innerHTML = '<tr><td colspan="10">Belum ada data project.</td></tr>';
        return;
    }

    targetTableBody.innerHTML = '';

    projects.forEach((project) => {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        const projectCell = document.createElement('td');
        const makerCell = document.createElement('td');
        const creatorCell = document.createElement('td');
        const employeeCell = document.createElement('td');
        const paymentCell = document.createElement('td');
        const startCell = document.createElement('td');
        const deadlineCell = document.createElement('td');
        const statusCell = document.createElement('td');
        const actionCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        const rowActions = document.createElement('div');
        const detailLink = document.createElement('a');
        const editButton = document.createElement('button');
        const deleteButton = document.createElement('button');
        const sponsorOwnsProject = isSponsorArea && isOwnedProject(project);

        idCell.textContent = project.id_project;
        projectCell.textContent = project.nama_project;
        makerCell.textContent = project.pembuat || '-';
        const freelancers = getListValue(project.nama_user).filter(Boolean);
        creatorCell.textContent = freelancers.length > 0 ? freelancers.join(', ') : 'Belum ada freelance';
        renderRoleProjectToggle(project, employeeCell);
        paymentCell.textContent = formatRupiah(project.bayaran);
        startCell.textContent = formatDate(project.tgl_mulai);
        deadlineCell.textContent = formatDate(project.deadline);
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        actionCell.className = 'action-cell';
        rowActions.className = 'row-actions project-actions';

        if (sponsorOwnsProject) {
            detailLink.className = 'action-btn detail';
            detailLink.href = `/page/sponsor/detail-project.html?id=${project.id_project}`;
            detailLink.title = 'Lihat detail project';
            detailLink.setAttribute('aria-label', `Lihat detail project ${project.nama_project}`);
            detailLink.innerHTML = '<i class="fas fa-eye"></i><span>Detail</span>';
            rowActions.appendChild(detailLink);
        }

        if (sponsorOwnsProject && project.status_project === 'pending') {
            editButton.className = 'action-btn edit';
            editButton.type = 'button';
            editButton.title = 'Edit project';
            editButton.setAttribute('aria-label', `Edit project ${project.nama_project}`);
            editButton.innerHTML = '<i class="fas fa-pen"></i><span>Edit</span>';
            editButton.addEventListener('click', () => openEditProjectModal(project));
            deleteButton.className = 'action-btn delete';
            deleteButton.type = 'button';
            deleteButton.title = 'Hapus project';
            deleteButton.setAttribute('aria-label', `Hapus project ${project.nama_project}`);
            deleteButton.innerHTML = '<i class="fas fa-trash"></i><span>Hapus</span>';
            deleteButton.addEventListener('click', () => deleteProject(project));
            rowActions.append(editButton, deleteButton);
        }

        if (rowActions.children.length) {
            actionCell.appendChild(rowActions);
        } else {
            const text = document.createElement('span');
            text.className = 'disabled-text';
            text.textContent = '-';
            actionCell.appendChild(text);
        }

        row.append(idCell, projectCell, makerCell, creatorCell, employeeCell, paymentCell, startCell, deadlineCell, statusCell, actionCell);
        targetTableBody.appendChild(row);
    });
}

async function loadProjects(successMessage = '', successType = '') {
    setMessage(projectMessage, 'Memuat data project...');

    try {
        const [projectResponse, userResponse, meResponse] = await Promise.all([
            fetch(projectApiBase),
            fetch(projectUsersApi),
            fetch('/api/me'),
        ]);
        const result = await readJson(projectResponse);
        const userResult = await readJson(userResponse);
        const meResult = await readJson(meResponse);

        if (!projectResponse.ok) {
            throw new Error(result.message || 'Data project gagal dimuat.');
        }

        if (!userResponse.ok) {
            throw new Error(userResult.message || 'Data freelance gagal dimuat.');
        }

        if (!meResponse.ok) {
            throw new Error(meResult.message || 'Data user login gagal dimuat.');
        }

        currentUser = meResult.user || null;
        projectsData = result.projects || [];
        renderProjectSummary(projectsData, userResult.users || []);
        renderProjects(projectsData, projectTableBody);
        if (myProjectTableBody) {
            renderProjects(projectsData.filter(isOwnedProject), myProjectTableBody);
            setMessage(myProjectMessage, successMessage, successType);
        }
        setMessage(projectMessage, successMessage, successType);
    } catch (error) {
        projectTableBody.innerHTML = '<tr><td colspan="10">Data gagal dimuat.</td></tr>';
        if (myProjectTableBody) {
            myProjectTableBody.innerHTML = '<tr><td colspan="10">Data gagal dimuat.</td></tr>';
            setMessage(myProjectMessage, error.message, 'error');
        }
        setMessage(projectMessage, error.message, 'error');
    }
}

async function loadUsers(successMessage = '', successType = '') {
    setMessage(userMessage, 'Memuat data user...');

    try {
        const response = await fetch('/api/admin/users');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data user gagal dimuat.');
        }

        const users = result.users || [];
        renderUserSummary(users);
        renderUsers(users);
        setMessage(userMessage, successMessage, successType);
    } catch (error) {
        userTableBody.innerHTML = '<tr><td colspan="5">Data gagal dimuat.</td></tr>';
        setMessage(userMessage, error.message, 'error');
    }
}

function isSameDate(firstDate, secondDate) {
    return firstDate.getFullYear() === secondDate.getFullYear()
        && firstDate.getMonth() === secondDate.getMonth()
        && firstDate.getDate() === secondDate.getDate();
}

function buildCalendarControls() {
    monthNames.forEach((monthName, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = monthName;
        monthSelect.appendChild(option);
    });

    const startYear = today.getFullYear() - 10;
    const endYear = today.getFullYear() + 10;

    for (let year = startYear; year <= endYear; year += 1) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

function ensureYearOption(year) {
    const hasYear = Array.from(yearSelect.options).some((option) => Number(option.value) === year);

    if (hasYear) {
        return;
    }

    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);

    Array.from(yearSelect.options)
        .sort((firstOption, secondOption) => Number(firstOption.value) - Number(secondOption.value))
        .forEach((sortedOption) => yearSelect.appendChild(sortedOption));
}

function updateCalendarControls() {
    ensureYearOption(visibleYear);
    monthSelect.value = visibleMonth;
    yearSelect.value = visibleYear;
    calendarCurrent.textContent = `${monthNames[visibleMonth]} ${visibleYear}`;
}

function renderCalendar() {
    calendarDays.innerHTML = '';

    const firstDay = new Date(visibleYear, visibleMonth, 1);
    const firstGridDate = new Date(visibleYear, visibleMonth, 1 - firstDay.getDay());

    updateCalendarControls();

    for (let index = 0; index < 42; index += 1) {
        const date = new Date(firstGridDate);
        date.setDate(firstGridDate.getDate() + index);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calendar-day';
        button.textContent = date.getDate();
        button.setAttribute(
            'aria-label',
            `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
        );

        if (date.getMonth() !== visibleMonth) {
            button.classList.add('is-muted');
        }

        if (isSameDate(date, today)) {
            button.classList.add('is-today');
        }

        if (isSameDate(date, selectedDate)) {
            button.classList.add('is-selected');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.setAttribute('aria-pressed', 'false');
        }

        button.addEventListener('click', () => {
            selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            visibleMonth = selectedDate.getMonth();
            visibleYear = selectedDate.getFullYear();
            renderCalendar();
        });

        calendarDays.appendChild(button);
    }
}

function moveMonth(step) {
    const nextDate = new Date(visibleYear, visibleMonth + step, 1);
    visibleMonth = nextDate.getMonth();
    visibleYear = nextDate.getFullYear();
    renderCalendar();
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

if (calendarDays && calendarCurrent && monthSelect && yearSelect && prevMonthBtn && nextMonthBtn) {
    buildCalendarControls();
    renderCalendar();

    monthSelect.addEventListener('change', () => {
        visibleMonth = Number(monthSelect.value);
        renderCalendar();
    });

    yearSelect.addEventListener('change', () => {
        visibleYear = Number(yearSelect.value);
        renderCalendar();
    });

    prevMonthBtn.addEventListener('click', () => moveMonth(-1));
    nextMonthBtn.addEventListener('click', () => moveMonth(1));
}

if (projectTableBody && projectMessage) {
    loadProjects();
}

if (userTableBody && userMessage) {
    loadUsers();

    userTableBody.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest('.user-delete-btn');
        if (!deleteButton) return;

        const id = deleteButton.dataset.id;
        const name = deleteButton.dataset.name;
        const confirmed = confirm(`Hapus data user "${name}"?`);
        if (!confirmed) return;

        deleteButton.disabled = true;
        deleteButton.textContent = 'Menghapus...';

        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });
            const result = await readJson(response);

            if (!response.ok) {
                throw new Error(result.message || 'User gagal dihapus.');
            }

            await loadUsers(result.message || 'User berhasil dihapus.', 'success');
            if (projectTableBody && projectMessage) {
                await loadProjects();
            }
        } catch (error) {
            setMessage(userMessage, error.message, 'error');
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i><span>Hapus</span>';
        }
    });
}

if (editProjectForm) {
    editProjectForm.addEventListener('invalid', showEditValidationMessage, true);

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            if (!editProjectForm.checkValidity()) {
                showEditValidationMessage();
            }
        });
    }

    editProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!editProjectForm.checkValidity()) {
            showEditValidationMessage();
            editProjectForm.reportValidity();
            return;
        }

        const formData = new FormData(editProjectForm);
        const payload = Object.fromEntries(formData.entries());
        payload.role_project = [...new Set(formData.getAll('role_project')
            .map((role) => String(role || '').trim())
            .filter(Boolean))];
        payload.bayaran = Number(payload.bayaran);

        if (!payload.role_project.length) {
            setMessage(editProjectMessage, 'Isi minimal satu role project.', 'error');
            return;
        }

        if (!Number.isInteger(payload.bayaran) || payload.bayaran < 0) {
            setMessage(editProjectMessage, 'Bayaran harus berupa angka 0 atau lebih.', 'error');
            return;
        }

        if (saveEditBtn) {
            saveEditBtn.disabled = true;
            saveEditBtn.textContent = 'Menyimpan...';
        }
        setMessage(editProjectMessage, '');

        try {
            const response = await fetch(`${projectApiBase}/${editProjectId.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const result = await readJson(response);

            if (!response.ok) {
                throw new Error(result.message || 'Project gagal diupdate.');
            }

            closeEditProjectModal();
            await loadProjects(result.message || 'Project berhasil diupdate.', 'success');
        } catch (error) {
            setMessage(editProjectMessage, error.message, 'error');
        } finally {
            if (saveEditBtn) {
                saveEditBtn.disabled = false;
                saveEditBtn.textContent = 'Simpan';
            }
        }
    });
}

if (addEditRoleProjectBtn) {
    addEditRoleProjectBtn.addEventListener('click', () => {
        createRoleProjectInput(editEmployeeList).focus();
    });
}

if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', closeEditProjectModal);
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditProjectModal);
}

if (editProjectModal) {
    editProjectModal.addEventListener('click', (event) => {
        if (event.target === editProjectModal) {
            closeEditProjectModal();
        }
    });
}
