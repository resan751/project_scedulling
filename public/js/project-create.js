const createProjectForm = document.getElementById('createProjectForm');
const roleProjectList = document.getElementById('roleProjectList');
const addRoleProjectBtn = document.getElementById('addRoleProjectBtn');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const logoutBtn = document.getElementById('logoutBtn');

function setMessage(message, type = '') {
    formMessage.textContent = message;
    formMessage.className = `message ${type}`.trim();
}

function createRoleProjectInput(value = '') {
    const row = document.createElement('div');
    const input = document.createElement('input');
    const removeButton = document.createElement('button');

    row.className = 'role-project-row';
    input.type = 'text';
    input.name = 'role_project';
    input.placeholder = 'Contoh: backend';
    input.required = true;
    input.value = value;

    removeButton.className = 'icon-btn';
    removeButton.type = 'button';
    removeButton.textContent = 'x';
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

if (addRoleProjectBtn) {
    addRoleProjectBtn.addEventListener('click', () => {
        createRoleProjectInput();
    });
}

createProjectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(createProjectForm);
    const payload = Object.fromEntries(formData.entries());
    payload.role_project = getRoleProjectValues(formData);

    setMessage('');

    if (!payload.role_project.length) {
        setMessage('Isi minimal satu role project.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Project gagal dibuat.');
        }

        window.location.href = result.redirectTo || '/page/admin/dashboard.html';
    } catch (error) {
        setMessage(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Project';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}
