// jadwal-kalender.js — Shared calendar logic for Freelancer & Sponsor
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calMonthLabel');
    const prevBtn = document.getElementById('calPrev');
    const nextBtn = document.getElementById('calNext');
    const todayBtn = document.getElementById('calToday');

    if (!grid) return;

    let currentDate = new Date();
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
    const hari = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

    let events = [];

    function dateKey(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    async function loadProjectEvents() {
        try {
            const [projectsResponse, meResponse] = await Promise.all([
                fetch('/api/freelance/projects', { credentials: 'same-origin' }),
                fetch('/api/me', { credentials: 'same-origin' }),
            ]);
            if (!projectsResponse.ok || !meResponse.ok) throw new Error('Gagal memuat jadwal project.');

            const { projects = [] } = await projectsResponse.json();
            const { user } = await meResponse.json();
            const myProjects = projects.filter((project) =>
                (project.id_user || []).some((id) => String(id) === String(user.id_user))
            );
            events = myProjects.flatMap((project) => [
                { date: dateKey(project.tgl_mulai), type: 'purple', label: `${project.nama_project} dimulai` },
                { date: dateKey(project.deadline), type: 'amber', label: `Deadline ${project.nama_project}` },
            ]).filter((event) => event.date);
            renderCalendar(currentDate);
        } catch (error) {
            console.error(error);
        }
    }

    function getEventsForDate(dateStr) {
        return events.filter(e => e.date === dateStr);
    }

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        label.textContent = `${bulan[month]} ${year}`;

        let html = hari.map(h => `<div class="cal-header">${h}</div>`).join('');

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        // Previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const dayEvents = getEventsForDate(dateStr);
            let cls = 'cal-day';
            if (isToday) cls += ' today';

            let dotsHtml = '';
            if (dayEvents.length > 0) {
                dotsHtml = '<div class="event-dots">';
                dayEvents.slice(0, 3).forEach(ev => {
                    dotsHtml += `<span class="event-dot c-${ev.type}"></span>`;
                });
                dotsHtml += '</div>';
            }

            html += `<div class="${cls}" title="${dayEvents.map(e => e.label).join(', ')}">${d}${dotsHtml}</div>`;
        }

        // Next month
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="cal-day other-month">${i}</div>`;
        }

        grid.innerHTML = html;
    }

    // Navigation
    prevBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    todayBtn?.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar(currentDate);
    });

    // View toggle (placeholder)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Set today's date display
    const todayDate = document.getElementById('todayDate');
    if (todayDate) {
        const now = new Date();
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        todayDate.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Render immediately, then replace placeholders with the user's project data.
    renderCalendar(currentDate);
    loadProjectEvents();
});
