const createProjectForm = document.getElementById('createProjectForm');
const employeeList = document.getElementById('employeeList');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const logoutBtn = document.getElementById('logoutBtn');

function setMessage(message, type = '') {
    formMessage.textContent = message;
    formMessage.className = `message ${type}`.trim();
}

async function loadKaryawanOptions() {
    try {
        const response = await fetch('/api/project-karyawan');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Data karyawan gagal dimuat.');
        }

        employeeList.innerHTML = '';

        if (!result.users.length) {
            const emptyText = document.createElement('p');
            emptyText.className = 'empty-text';
            emptyText.textContent = 'Belum ada user dengan role karyawan';
            employeeList.appendChild(emptyText);
            submitBtn.disabled = true;
            return;
        }

        result.users.forEach((user) => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const name = document.createElement('span');

            label.className = 'employee-option';
            checkbox.type = 'checkbox';
            checkbox.name = 'nama_karyawan';
            checkbox.value = user.nama_karyawan;
            name.textContent = user.nama_karyawan;

            label.append(checkbox, name);
            employeeList.appendChild(label);
        });
    } catch (error) {
        employeeList.innerHTML = '';
        submitBtn.disabled = true;
        setMessage(error.message, 'error');
    }
}

createProjectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(createProjectForm);
    const payload = Object.fromEntries(formData.entries());
    payload.nama_karyawan = formData.getAll('nama_karyawan');

    setMessage('');

    if (!payload.nama_karyawan.length) {
        setMessage('Pilih minimal satu karyawan.', 'error');
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

loadKaryawanOptions();
