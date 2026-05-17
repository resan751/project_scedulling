const logoutBtn = document.getElementById('logoutBtn');
const calendarDays = document.getElementById('calendarDays');
const calendarCurrent = document.getElementById('calendarCurrent');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

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
