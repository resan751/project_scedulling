const createProjectForm = document.getElementById('form-create-project');
const roleProjectList = document.getElementById('role-project-list');
const addRoleProjectBtn = document.getElementById('btn-add-role');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
const pembuatProjectInput = document.getElementById('pembuatProject');
const isSponsorArea = window.location.pathname.includes('/sponsor/');

function setMessage(message, type = '') {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `message ${type}`.trim();
}

async function readJson(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return { message: 'Session berakhir atau server mengirim response tidak valid. Silakan login ulang.' };
}

function createRoleProjectInput(value = '') {
    const row = document.createElement('div');
    const input = document.createElement('input');
    const removeButton = document.createElement('button');

    row.className = 'role-project-row';
    input.type = 'text';
    input.name = 'role_project';
    input.className = 'field-input';
    input.placeholder = 'Contoh: Frontend Developer';
    input.required = true;
    input.value = value;

    removeButton.className = 'btn btn-danger btn-sm icon-btn-del';
    removeButton.type = 'button';
    removeButton.innerHTML = '<i class="fas fa-trash"></i>';
    removeButton.title = 'Hapus Role';
    removeButton.setAttribute('aria-label', 'Hapus role project');
    removeButton.addEventListener('click', () => {
        row.remove();
    });

    row.append(input, removeButton);
    roleProjectList.appendChild(row);
    input.focus();
}

function getRoleProjectValues(formData) {
    return [...new Set(formData.getAll('role_project')
        .map((role) => String(role || '').trim())
        .filter(Boolean))];
}

function showCreateValidationMessage() {
    setMessage('Lengkapi semua field wajib sebelum menyimpan project.', 'error');
}

async function loadCurrentAdmin() {
    if (!pembuatProjectInput) return;

    try {
        const response = await fetch('/api/me');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'User login gagal dimuat.');
        }

        pembuatProjectInput.value = result.user?.nama_user || '';
    } catch (error) {
        setMessage(error.message, 'error');
    }
}

if (addRoleProjectBtn && roleProjectList) {
    addRoleProjectBtn.addEventListener('click', () => {
        createRoleProjectInput();
    });
}

if (createProjectForm) {
    loadCurrentAdmin();

    createProjectForm.addEventListener('invalid', showCreateValidationMessage, true);

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!createProjectForm.checkValidity()) {
                showCreateValidationMessage();
            }
        });
    }

    createProjectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!createProjectForm.checkValidity()) {
        showCreateValidationMessage();
        createProjectForm.reportValidity();
        return;
    }

    const formData = new FormData(createProjectForm);
    const payload = Object.fromEntries(formData.entries());
    payload.role_project = getRoleProjectValues(formData);
    payload.bayaran = Number(payload.bayaran);

    setMessage('');

    if (!payload.role_project.length) {
        setMessage('Isi minimal satu role project.', 'error');
        return;
    }

    if (!Number.isInteger(payload.bayaran) || payload.bayaran < 0) {
        setMessage('Bayaran harus berupa angka 0 atau lebih.', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    try {
        const response = await fetch('/api/sponsor/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Project gagal dibuat.');
        }

        window.location.href = result.redirectTo || (isSponsorArea ? '/page/sponsor/dashboard.html' : '/page/admin/dashboard.html');
    } catch (error) {
        setMessage(error.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Simpan Project';
        }
    }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}
