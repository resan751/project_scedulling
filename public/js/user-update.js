const updateUserForm = document.getElementById('form-update-user');
const namaUserInput = document.getElementById('namaUser');
const emailUserInput = document.getElementById('emailUser');
const roleUserInput = document.getElementById('roleUser');
const passwordUserInput = document.getElementById('passwordUser');
const userUpdateMessage = document.getElementById('userUpdateMessage');
const submitUpdateUserBtn = document.getElementById('submitUpdateUserBtn');

const params = new URLSearchParams(window.location.search);
const userId = params.get('id');

async function readJson(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return { message: 'Server mengirim response yang tidak valid.' };
}

function setUpdateMessage(message, type = '') {
    if (!userUpdateMessage) return;

    userUpdateMessage.textContent = message;
    userUpdateMessage.className = `form-message ${type}`.trim();
}

function setSubmitLoading(isLoading) {
    if (!submitUpdateUserBtn) return;

    submitUpdateUserBtn.disabled = isLoading;
    submitUpdateUserBtn.innerHTML = isLoading
        ? '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'
        : '<i class="fas fa-save"></i> Update User';
}

async function loadUser() {
    if (!userId) {
        setUpdateMessage('Pilih user dari tabel Kelola User terlebih dahulu.', 'error');
        updateUserForm?.querySelectorAll('input, select, button').forEach((element) => {
            element.disabled = true;
        });
        return;
    }

    setUpdateMessage('Memuat data user...');

    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const result = await readJson(response);

        if (!response.ok) {
            throw new Error(result.message || 'Data user gagal dimuat.');
        }

        namaUserInput.value = result.user.nama_user || '';
        emailUserInput.value = result.user.email || '';
        roleUserInput.value = result.user.role || 'freelance';
        passwordUserInput.value = '';
        setUpdateMessage('');
    } catch (error) {
        setUpdateMessage(error.message, 'error');
    }
}

if (updateUserForm) {
    loadUser();

    updateUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!userId) {
            setUpdateMessage('ID user tidak ditemukan.', 'error');
            return;
        }

        const formData = new FormData(updateUserForm);
        const payload = {
            nama_user: String(formData.get('nama_user') || '').trim(),
            email: String(formData.get('email') || '').trim(),
            role: String(formData.get('role') || '').trim(),
            password: String(formData.get('password') || ''),
        };

        setSubmitLoading(true);
        setUpdateMessage('');

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const result = await readJson(response);

            if (!response.ok) {
                throw new Error(result.message || 'User gagal diupdate.');
            }

            setUpdateMessage(result.message || 'User berhasil diupdate.', 'success');
            window.location.href = '/page/admin/kelola-user.html';
        } catch (error) {
            setUpdateMessage(error.message, 'error');
        } finally {
            setSubmitLoading(false);
        }
    });
}
