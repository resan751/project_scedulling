// calendar-popup.js — Shared calendar popup logic
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('calendarPopup');
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calMonthLabel');
    const subtitle = document.getElementById('calPopupSubtitle');
    const prevBtn = document.getElementById('calPrev');
    const nextBtn = document.getElementById('calNext');

    // Jika ada kalender utama di halaman jadwal
    const gridMain = document.getElementById('calendarGridMain');
    const labelMain = document.getElementById('calMonthLabelMain');
    const prevMain = document.getElementById('calPrevMain');
    const nextMain = document.getElementById('calNextMain');

    if (!grid && !gridMain) return;

    let currentDate = new Date();
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
    const hari = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

    // Sample event dates (YYYY-MM-DD)
    const eventDates = [
        '2026-07-10','2026-07-15','2026-07-20','2026-07-28',
        '2026-08-05','2026-08-15'
    ];

    function renderCalendar(targetGrid, targetLabel, date) {
        if (!targetGrid) return;
        const year = date.getFullYear();
        const month = date.getMonth();
        targetLabel.textContent = `${bulan[month]} ${year}`;
        if (subtitle && targetLabel.id === 'calMonthLabel') {
            subtitle.textContent = `${bulan[month]} ${year}`;
        }

        let html = hari.map(h => `<div class="cal-header">${h}</div>`).join('');

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const hasEvent = eventDates.includes(dateStr);
            let cls = 'cal-day';
            if (isToday) cls += ' today';
            if (hasEvent) cls += ' has-event';
            html += `<div class="${cls}">${d}</div>`;
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="cal-day other-month">${i}</div>`;
        }

        targetGrid.innerHTML = html;
    }

    // Render popup calendar
    if (grid) {
        renderCalendar(grid, label, currentDate);
        prevBtn?.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(grid, label, currentDate);
            if (gridMain) renderCalendar(gridMain, labelMain, currentDate);
        });
        nextBtn?.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(grid, label, currentDate);
            if (gridMain) renderCalendar(gridMain, labelMain, currentDate);
        });
    }

    // Render main calendar (jadwal-kalender.html)
    if (gridMain) {
        renderCalendar(gridMain, labelMain, currentDate);
        prevMain?.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(gridMain, labelMain, currentDate);
            if (grid) renderCalendar(grid, label, currentDate);
        });
        nextMain?.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(gridMain, labelMain, currentDate);
            if (grid) renderCalendar(grid, label, currentDate);
        });
    }

    // Sidebar kalender link → buka popup (jika di halaman non-jadwal)
    const navKal = document.getElementById('navKalender');
    if (navKal && !gridMain) {
        navKal.addEventListener('click', (e) => {
            if (popup) {
                e.preventDefault();
                popup.hidden = false;
            }
        });
    }
});