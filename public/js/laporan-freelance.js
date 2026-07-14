document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
    const totalLaporanCreated = document.getElementById('totalLaporanCreated');
    const totalProjectRegistered = document.getElementById('totalProjectRegistered');
    const totalProjectFinished = document.getElementById('totalProjectFinished');
    const laporanCardsContainer = document.getElementById('laporanCardsContainer');
    const laporanListMessage = document.getElementById('laporanListMessage');

    let currentUser = null;

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

    function getLaporanTypeClass(type) {
        if (type === 'progress') return 'progress';
        if (type === 'problem') return 'problem';
        if (type === 'notice') return 'notice';
        return 'progress';
    }

    function getLaporanTypeLabel(type) {
        const labels = {
            progress: 'Progress',
            problem: 'Problem',
            notice: 'Notice',
        };
        return labels[type] || type || '-';
    }

    function getStatusClass(status) {
        if (status === 'pending') return 'waiting';
        if (status === 'approve') return 'done';
        if (status === 'ditolak') return 'rejected';
        return '';
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
            await loadLaporanDashboard();
        } catch (error) {
            console.error(error);
            window.location.href = '/login.html';
        }
    }

    async function loadLaporanDashboard() {
        setMessage(laporanListMessage, 'Memuat riwayat laporan...');
        
        try {
            // Load projects first to calculate registered & finished
            const projectsResponse = await fetch('/api/freelance/projects', { credentials: 'same-origin' });
            const projectsResult = await readJson(projectsResponse);

            let myProjects = [];
            if (projectsResponse.ok && projectsResult.projects) {
                myProjects = projectsResult.projects.filter(project => {
                    const freelancerIds = project.id_user || [];
                    return freelancerIds.some(id => String(id) === String(currentUser.id_user));
                });
            }

            totalProjectRegistered.textContent = myProjects.length;
            totalProjectFinished.textContent = myProjects.filter(p => p.status_project === 'selesai').length;

            // Load all laporan created by this user
            const profileResponse = await fetch('/api/freelance/profile', { credentials: 'same-origin' });
            const profileResult = await readJson(profileResponse);

            if (!profileResponse.ok) {
                throw new Error(profileResult.message || 'Gagal memuat profil freelance.');
            }

            const nama_user = profileResult.user?.nama_user;
            
            // We fetch the list of user's laporan by fetching project details for projects they belong to
            // or we request a custom endpoint if there is one. Since we do not have a dedicated "/api/freelance/laporan" endpoint,
            // we can fetch the laporan details for each registered project and filter by their user name.
            let allLaporan = [];

            for (const project of myProjects) {
                try {
                    const lapsResponse = await fetch(`/api/freelance/projects/${project.id_project}/laporan`, { credentials: 'same-origin' });
                    if (lapsResponse.ok) {
                        const lapsResult = await readJson(lapsResponse);
                        const projectLaporans = lapsResult.laporan || [];
                        // Filter laporan specifically made by this user
                        const userLaporans = projectLaporans.filter(l => l.nama_user === nama_user);
                        allLaporan.push(...userLaporans);
                    }
                } catch (e) {
                    console.error(`Gagal memuat laporan project ID ${project.id_project}:`, e);
                }
            }

            // Sort by id_laporan descending
            allLaporan.sort((a, b) => b.id_laporan - a.id_laporan);

            totalLaporanCreated.textContent = allLaporan.length;

            renderLaporanCards(allLaporan);
            setMessage(laporanListMessage, '');
        } catch (error) {
            console.error(error);
            laporanCardsContainer.innerHTML = '<div class="empty-text" style="grid-column: 1 / -1;">Gagal memuat data laporan.</div>';
            setMessage(laporanListMessage, error.message, 'error');
        }
    }

    function renderLaporanCards(laporanList) {
        if (!laporanList.length) {
            laporanCardsContainer.innerHTML = `
                <div class="empty-text" style="grid-column: 1 / -1; padding: 40px; background: white; border-radius: var(--radius-lg); border: 1px solid rgba(108, 61, 224, 0.06);">
                    <i class="fas fa-file-excel" style="font-size: 32px; color: var(--text-light); margin-bottom: 12px;"></i>
                    <p>Anda belum pernah membuat laporan kerja.</p>
                </div>
            `;
            return;
        }

        laporanCardsContainer.innerHTML = '';
        laporanList.forEach(item => {
            const card = document.createElement('div');
            card.className = 'laporan-card';

            // Header
            const header = document.createElement('div');
            header.className = 'laporan-card-header';
            
            const title = document.createElement('span');
            title.className = 'laporan-title';
            title.textContent = item.nama_project;

            const typeBadge = document.createElement('span');
            typeBadge.className = `badge-type ${getLaporanTypeClass(item.jenis_laporan)}`;
            typeBadge.textContent = getLaporanTypeLabel(item.jenis_laporan);

            header.append(title, typeBadge);

            // Body
            const body = document.createElement('div');
            body.className = 'laporan-card-body';

            const role = document.createElement('div');
            role.innerHTML = `<small class="text-muted" style="display:block;font-size:11px;text-transform:uppercase;font-weight:700;">Role Anda</small><strong>${item.role_project}</strong>`;

            const description = document.createElement('div');
            description.innerHTML = `<small class="text-muted" style="display:block;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Deskripsi Kerja</small><p class="text-muted" style="font-size:13px;line-height:1.5;">${item.deskripsi_laporan}</p>`;

            body.append(role, description);

            // Footer
            const footer = document.createElement('div');
            footer.className = 'laporan-card-footer';

            // Status Laporan
            const statusWrapper = document.createElement('div');
            const statusLabel = document.createElement('span');
            statusLabel.className = `status-badge ${getStatusClass(item.status_laporan)}`.trim();
            statusLabel.textContent = item.status_laporan || 'pending';
            statusWrapper.appendChild(statusLabel);

            // Proof Link
            const proofLink = document.createElement('a');
            proofLink.className = 'link-btn';
            proofLink.href = item.bukti;
            proofLink.target = '_blank';
            proofLink.rel = 'noopener noreferrer';
            proofLink.innerHTML = '<i class="fas fa-eye"></i> Bukti';

            footer.append(statusWrapper, proofLink);

            card.append(header, body, footer);
            laporanCardsContainer.appendChild(card);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
            window.location.href = '/login.html';
        });
    }

    checkAuth();
});
