const logoutBtn = document.getElementById('logoutBtn');
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
const totalProjectCount = document.getElementById('totalProjectCount');
const waitingProjectCount = document.getElementById('waitingProjectCount');
const approvedProjectCount = document.getElementById('approvedProjectCount');
const editProjectModal = document.getElementById('editProjectModal');
const editProjectForm = document.getElementById('editProjectForm');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const editProjectId = document.getElementById('editProjectId');
const editNamaProject = document.getElementById('editNamaProject');
const editEmployeeList = document.getElementById('editEmployeeList');
const editTanggalMulai = document.getElementById('editTanggalMulai');
const editDeadline = document.getElementById('editDeadline');
const editDeskripsi = document.getElementById('editDeskripsi');
const editProjectMessage = document.getElementById('editProjectMessage');

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
let employeeOptions = [];

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

function formatDateInput(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getStatusClass(status) {
    if (status === 'pending') return 'waiting';
    if (status === 'belum dimulai') return 'pending';
    if (status === 'sedang dikerjakan') return 'progress';
    if (status === 'selesai') return 'done';
    if (status === 'ditolak') return 'rejected';
    return '';
}

function renderProjectSummary(projects) {
    const waitingProjects = projects.filter((project) => project.status_project === 'pending').length;
    const approvedProjects = projects.filter((project) => (
        ['belum dimulai', 'sedang dikerjakan', 'selesai'].includes(project.status_project)
    )).length;

    if (!totalProjectCount || !waitingProjectCount || !approvedProjectCount) {
        return;
    }

    totalProjectCount.textContent = projects.length;
    waitingProjectCount.textContent = waitingProjects;
    approvedProjectCount.textContent = approvedProjects;
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

function buildEmployeeCheckboxes(selectedNames = []) {
    editEmployeeList.innerHTML = '';

    if (!employeeOptions.length) {
        const emptyText = document.createElement('p');
        emptyText.className = 'empty-text';
        emptyText.textContent = 'Belum ada user dengan role karyawan';
        editEmployeeList.appendChild(emptyText);
        return;
    }

    const selectedNameSet = new Set(selectedNames);

    employeeOptions.forEach((user) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        const name = document.createElement('span');

        label.className = 'employee-option';
        checkbox.type = 'checkbox';
        checkbox.name = 'nama_user';
        checkbox.value = user.nama_user;
        checkbox.checked = selectedNameSet.has(user.nama_user);
        name.textContent = user.nama_user;

        label.append(checkbox, name);
        editEmployeeList.appendChild(label);
    });
}

function renderEmployeeToggle(project, employeeCell) {
    const employeeNames = getEmployeeNames(project.nama_user);
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
        updateLink.className = 'action-btn update';
        updateLink.href = `/page/admin/user-update.html?id=${user.id_user}`;
        updateLink.textContent = 'Update';

        deleteButton.className = 'action-btn delete user-delete-btn';
        deleteButton.type = 'button';
        deleteButton.dataset.id = user.id_user;
        deleteButton.dataset.name = user.nama_user;
        deleteButton.textContent = 'Delete';

        rowActions.append(updateLink, deleteButton);
        actionCell.appendChild(rowActions);
        row.append(idCell, nameCell, emailCell, roleCell, actionCell);
        userTableBody.appendChild(row);
    });
}

function openEditProjectModal(project) {
    editProjectId.value = project.id_project;
    editNamaProject.value = project.nama_project;
    editTanggalMulai.value = formatDateInput(project.tgl_mulai);
    editDeadline.value = formatDateInput(project.deadline);
    editDeskripsi.value = project.deskripsi_project || '';
    buildEmployeeCheckboxes(getEmployeeNames(project.nama_user));
    setMessage(editProjectMessage, '');
    editProjectModal.hidden = false;
    editNamaProject.focus();
}

function closeEditProjectModal() {
    editProjectModal.hidden = true;
    editProjectForm.reset();
    setMessage(editProjectMessage, '');
}

async function deleteProject(project) {
    const shouldDelete = confirm(`Hapus project "${project.nama_project}"?`);
    if (!shouldDelete) {
        return;
    }

    setMessage(projectMessage, 'Menghapus project...');

    try {
        const response = await fetch(`/api/admin/projects/${project.id_project}`, {
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
        const editButton = document.createElement('button');
        const deleteButton = document.createElement('button');

        idCell.textContent = project.id_project;
        projectCell.textContent = project.nama_project;
        renderEmployeeToggle(project, employeeCell);
        startCell.textContent = formatDate(project.tgl_mulai);
        deadlineCell.textContent = formatDate(project.deadline);
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        actionCell.className = 'action-cell';
        if (project.status_project === 'pending') {
            editButton.className = 'action-btn edit';
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => openEditProjectModal(project));
            deleteButton.className = 'action-btn delete';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Hapus';
            deleteButton.addEventListener('click', () => deleteProject(project));
            actionCell.append(editButton, deleteButton);
        } else {
            const text = document.createElement('span');
            text.className = 'disabled-text';
            text.textContent = '-';
            actionCell.appendChild(text);
        }

        row.append(idCell, projectCell, employeeCell, startCell, deadlineCell, statusCell, actionCell);
        projectTableBody.appendChild(row);
    });
}

async function loadKaryawanOptions() {
    try {
        const response = await fetch('/api/project-karyawan');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data karyawan gagal dimuat.');
        }

        employeeOptions = result.users || [];
    } catch (error) {
        employeeOptions = [];
        setMessage(projectMessage, error.message, 'error');
    }
}

async function loadProjects(successMessage = '', successType = '') {
    setMessage(projectMessage, 'Memuat data project...');

    try {
        const response = await fetch('/api/admin/projects');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data project gagal dimuat.');
        }

        projectsData = result.projects || [];
        renderProjectSummary(projectsData);
        renderProjects(projectsData);
        setMessage(projectMessage, successMessage, successType);
    } catch (error) {
        projectTableBody.innerHTML = '<tr><td colspan="7">Data gagal dimuat.</td></tr>';
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

        renderUsers(result.users || []);
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
    loadKaryawanOptions().then(() => loadProjects());
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
            await loadKaryawanOptions();
            await loadProjects();
        } catch (error) {
            setMessage(userMessage, error.message, 'error');
            deleteButton.disabled = false;
            deleteButton.textContent = 'Delete';
        }
    });
}

if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(editProjectForm);
        const payload = Object.fromEntries(formData.entries());
        payload.nama_user = formData.getAll('nama_user');

        if (!payload.nama_user.length) {
            setMessage(editProjectMessage, 'Pilih minimal satu karyawan.', 'error');
            return;
        }

        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Menyimpan...';
        setMessage(editProjectMessage, '');

        try {
            const response = await fetch(`/api/admin/projects/${editProjectId.value}`, {
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
            saveEditBtn.disabled = false;
            saveEditBtn.textContent = 'Simpan';
        }
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
