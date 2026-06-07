const logoutBtn = document.getElementById('logoutBtn');
const projectTitle = document.getElementById('projectTitle');
const projectStatus = document.getElementById('projectStatus');
const projectDescription = document.getElementById('projectDescription');
const projectStartDate = document.getElementById('projectStartDate');
const projectDeadline = document.getElementById('projectDeadline');
const rolesList = document.getElementById('rolesList');
const registerForm = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const detailMessage = document.getElementById('detailMessage');
const submitMessage = document.getElementById('submitMessage');

let currentUser = null;
let projectId = null;
let projectData = null;

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
        month: 'long',
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

        const urlParams = new URLSearchParams(window.location.search);
        projectId = Number(urlParams.get('id'));
        if (!projectId || Number.isNaN(projectId)) {
            window.location.href = '/page/freelance/dashboard.html';
            return;
        }

        loadProjectDetails();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

function renderRoles(roles, freelancers) {
    rolesList.innerHTML = '';
    
    let hasVacantRoles = false;

    roles.forEach((role, index) => {
        const assignedUser = freelancers[index];
        const container = document.createElement('label');
        container.className = 'employee-option';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.width = '100%';

        const leftSide = document.createElement('div');
        leftSide.style.display = 'flex';
        leftSide.style.alignItems = 'center';
        leftSide.style.gap = '10px';

        const roleText = document.createElement('span');
        roleText.textContent = role;
        roleText.style.fontWeight = 'bold';
        leftSide.appendChild(roleText);

        const rightSide = document.createElement('div');

        if (assignedUser) {
            // Already taken
            const badge = document.createElement('span');
            badge.style.fontSize = '0.8rem';
            badge.style.padding = '3px 8px';
            badge.style.borderRadius = '4px';
            if (assignedUser === currentUser.nama_user) {
                badge.textContent = 'Diisi oleh Anda';
                badge.style.background = 'rgba(22, 101, 52, 0.15)';
                badge.style.color = '#166534';
                badge.style.border = '1px solid rgba(22, 101, 52, 0.3)';
            } else {
                badge.textContent = `Diisi oleh: ${assignedUser}`;
                badge.style.background = 'rgba(148, 163, 184, 0.15)';
                badge.style.color = '#475569';
                badge.style.border = '1px solid rgba(148, 163, 184, 0.3)';
            }
            rightSide.appendChild(badge);
            container.appendChild(leftSide);
            container.appendChild(rightSide);
            container.style.cursor = 'not-allowed';
            container.style.opacity = '0.8';
        } else {
            // Vacant
            hasVacantRoles = true;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'roles';
            checkbox.value = role;
            checkbox.style.cursor = 'pointer';
            
            checkbox.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('input[name="roles"]:checked').length;
                submitBtn.disabled = checkedCount === 0;
            });

            leftSide.prepend(checkbox);

            const badge = document.createElement('span');
            badge.textContent = 'Tersedia';
            badge.style.fontSize = '0.8rem';
            badge.style.padding = '3px 8px';
            badge.style.borderRadius = '4px';
            badge.style.background = 'rgba(217, 119, 6, 0.15)';
            badge.style.color = '#d97706';
            badge.style.border = '1px solid rgba(217, 119, 6, 0.3)';
            rightSide.appendChild(badge);

            container.appendChild(leftSide);
            container.appendChild(rightSide);
        }

        rolesList.appendChild(container);
    });

    if (projectData.status_project !== 'pending') {
        // If project is not pending, disable registration completely
        submitBtn.disabled = true;
        submitBtn.textContent = 'Pendaftaran Ditutup';
        // Disable any vacant checkboxes
        document.querySelectorAll('input[name="roles"]').forEach(cb => {
            cb.disabled = true;
            cb.parentElement.parentElement.style.cursor = 'not-allowed';
            cb.parentElement.parentElement.style.opacity = '0.7';
        });
    } else {
        submitBtn.textContent = 'Daftar Peran Terpilih';
    }
}

async function loadProjectDetails() {
    setMessage(detailMessage, 'Memuat detail project...');
    
    try {
        const response = await fetch(`/api/freelance/projects/${projectId}`);
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat detail project.');
        }

        projectData = result.project;
        
        projectTitle.textContent = projectData.nama_project;
        projectStatus.className = `status-badge ${getStatusClass(projectData.status_project)}`.trim();
        projectStatus.textContent = projectData.status_project;
        
        projectDescription.textContent = projectData.deskripsi_project || 'Tidak ada deskripsi.';
        projectStartDate.value = formatDate(projectData.tgl_mulai);
        projectDeadline.value = formatDate(projectData.deadline);

        renderRoles(projectData.role_project, projectData.nama_user);
        setMessage(detailMessage, '');
    } catch (error) {
        console.error(error);
        setMessage(detailMessage, error.message, 'error');
    }
}

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const checkedCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
        const selectedRoles = Array.from(checkedCheckboxes).map(cb => cb.value);

        if (selectedRoles.length === 0) {
            setMessage(submitMessage, 'Silakan pilih minimal satu peran.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Mendaftar...';
        setMessage(submitMessage, '');

        try {
            const response = await fetch(`/api/freelance/projects/${projectId}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roles: selectedRoles }),
            });
            const result = await readJson(response);

            if (!response.ok) {
                throw new Error(result.message || 'Gagal mendaftar ke project.');
            }

            setMessage(submitMessage, 'Pendaftaran berhasil!', 'success');
            setTimeout(() => {
                setMessage(submitMessage, '');
                loadProjectDetails();
            }, 1500);
        } catch (error) {
            setMessage(submitMessage, error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Daftar Peran Terpilih';
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

checkAuth();
