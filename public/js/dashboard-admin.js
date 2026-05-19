const logoutBtn = document.getElementById('logoutBtn');
const calendarDays = document.getElementById('calendarDays');
const calendarCurrent = document.getElementById('calendarCurrent');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const projectTableBody = document.getElementById('projectTableBody');
const projectMessage = document.getElementById('projectMessage');

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

function renderProjects(projects) {
    if (!projects.length) {
        projectTableBody.innerHTML = '<tr><td colspan="6">Belum ada data project.</td></tr>';
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
        const statusBadge = document.createElement('span');

        idCell.textContent = project.id_project;
        projectCell.textContent = project.nama_project;
        renderEmployeeToggle(project, employeeCell);
        startCell.textContent = formatDate(project.tgl_mulai);
        deadlineCell.textContent = formatDate(project.deadline);
        statusBadge.className = `status-badge ${getStatusClass(project.status_project)}`.trim();
        statusBadge.textContent = project.status_project;
        statusCell.appendChild(statusBadge);

        row.append(idCell, projectCell, employeeCell, startCell, deadlineCell, statusCell);
        projectTableBody.appendChild(row);
    });
}

async function loadProjects() {
    setMessage(projectMessage, 'Memuat data project...');

    try {
        const response = await fetch('/api/admin/projects');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data project gagal dimuat.');
        }

        renderProjects(result.projects || []);
        setMessage(projectMessage, '');
    } catch (error) {
        projectTableBody.innerHTML = '<tr><td colspan="6">Data gagal dimuat.</td></tr>';
        setMessage(projectMessage, error.message, 'error');
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
