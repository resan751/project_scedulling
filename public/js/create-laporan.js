const logoutBtn = document.getElementById('logoutBtn');
const createLaporanForm = document.getElementById('createLaporanForm');
const formMessage = document.getElementById('formMessage');
const namaProjectSelect = document.getElementById('namaProject');
const roleProjectSelect = document.getElementById('roleProject');
const buktiInput = document.getElementById('bukti');
const jenisLaporanSelect = document.getElementById('jenisLaporan');
const submitBtn = document.getElementById('submitBtn');

let currentUser = null;
let projectsData = [];

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
        loadRegisteredProjects();
    } catch (error) {
        console.error(error);
        window.location.href = '/login.html';
    }
}

async function loadRegisteredProjects() {
    try {
        const response = await fetch('/api/freelance/projects');
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat data project.');
        }

        projectsData = result.projects || [];

        // Filter only registered projects (projects where current user is a member)
        const registeredProjects = projectsData.filter((project) => {
            const freelancers = project.nama_user || [];
            return freelancers.includes(currentUser.nama_user);
        });

        // Populate nama_project select
        namaProjectSelect.innerHTML = '<option value="">-- Pilih Project --</option>';
        registeredProjects.forEach((project) => {
            const option = document.createElement('option');
            option.value = project.nama_project;
            option.textContent = project.nama_project;
            option.dataset.projectData = JSON.stringify(project);
            namaProjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        setMessage(formMessage, error.message, 'error');
    }
}

function populateRoleProject() {
    const selectedProjectName = namaProjectSelect.value;
    roleProjectSelect.innerHTML = '<option value="">-- Pilih Role --</option>';

    if (!selectedProjectName) {
        return;
    }

    const selectedProject = projectsData.find((project) => project.nama_project === selectedProjectName);
    if (!selectedProject) {
        return;
    }

    // Get roles and freelancers arrays
    const roles = selectedProject.role_project || [];
    const freelancers = selectedProject.nama_user || [];

    // Find roles where current user is assigned
    const userRoles = [];
    freelancers.forEach((user, index) => {
        if (user === currentUser.nama_user) {
            userRoles.push(roles[index]);
        }
    });

    // Populate select with user roles
    userRoles.forEach((role) => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        roleProjectSelect.appendChild(option);
    });
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!file) {
        setMessage(formMessage, 'Silakan pilih file.', 'error');
        return false;
    }

    if (file.size > maxSize) {
        setMessage(formMessage, 'Ukuran file terlalu besar. Maksimal 5MB.', 'error');
        return false;
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    if (!allowedExtensions.includes(fileExtension)) {
        setMessage(formMessage, 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG.', 'error');
        return false;
    }

    return true;
}

async function handleSubmit(e) {
    e.preventDefault();
    setMessage(formMessage, '');

    const namaProject = namaProjectSelect.value;
    const roleProject = roleProjectSelect.value;
    const bukti = buktiInput.files[0];
    const jenisLaporan = jenisLaporanSelect.value;
    const deskripsiLaporan = document.getElementById('deskripsi').value;

    // Validation
    if (!namaProject || !roleProject || !bukti || !jenisLaporan || !deskripsiLaporan) {
        setMessage(formMessage, 'Semua field harus diisi.', 'error');
        return;
    }

    if (!validateFile(bukti)) {
        return;
    }

    submitBtn.disabled = true;
    setMessage(formMessage, 'Menyimpan laporan...');

    try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('nama_project', namaProject);
        formData.append('role_project', roleProject);
        formData.append('bukti', bukti);
        formData.append('jenis_laporan', jenisLaporan);
        formData.append('deskripsi_laporan', deskripsiLaporan);

        const response = await fetch('/api/freelance/laporan/create', {
            method: 'POST',
            body: formData,
        });

        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menyimpan laporan.');
        }

        setMessage(formMessage, 'Laporan berhasil dibuat!', 'success');
        createLaporanForm.reset();
        namaProjectSelect.innerHTML = '<option value="">-- Pilih Project --</option>';
        roleProjectSelect.innerHTML = '<option value="">-- Pilih Role --</option>';

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '/page/freelance/dashboard.html';
        }, 2000);
    } catch (error) {
        console.error(error);
        setMessage(formMessage, error.message, 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

namaProjectSelect.addEventListener('change', populateRoleProject);

createLaporanForm.addEventListener('submit', handleSubmit);

// Initialize on page load
checkAuth();
