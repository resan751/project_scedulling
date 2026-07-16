import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { hashPassword, readSession, setNoCache, createSessionToken } from './auth.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pendingStatuses = new Set(['pending', 'menunggu approve'])

function requireSponsor(req, res) {
    const session = readSession(req)
    if (!session) {
        res.redirect('/login.html')
        return null
    }

    if (session.role !== 'sponsor') {
        res.status(403).send('Akses ditolak. Halaman ini hanya untuk sponsor.')
        return null
    }

    return session
}

function requireSponsorApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (session.role !== 'sponsor') {
        res.status(403).json({ message: 'Akses ditolak. Hanya sponsor yang dapat mengelola project.' })
        return null
    }

    return session
}

function getProjectId(req, res) {
    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        res.status(400).json({ message: 'ID project tidak valid.' })
        return null
    }

    return id_project
}

function isProjectOwner(project, session) {
    return String(project.pembuat || '').trim().toLowerCase() === String(session.nama_user || '').trim().toLowerCase()
}

function parseProjectDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function parseProjectPayment(value) {
    const bayaran = Number(value)
    return Number.isInteger(bayaran) && bayaran >= 0 ? bayaran : null
}

function parseStringList(value) {
    const values = Array.isArray(value) ? value : [value]

    return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))]
}

function parseProjectRoles(value) {
    const roles = parseStringList(value)

    return roles.map((role) => role.slice(0, 100))
}

function stringifyProjectRoles(roles) {
    const roleProject = JSON.stringify(roles)

    return roleProject.length <= 255 ? roleProject : null
}

function validateRoleProjectLength(roles, res) {
    const roleProject = stringifyProjectRoles(roles)
    if (!roleProject) {
        res.status(400).json({ message: 'Role project terlalu panjang untuk disimpan.' })
        return null
    }

    return roleProject
}

function buildEmptyProjectUserIds(roles) {
    return JSON.stringify(new Array(roles.length).fill(''))
}

function preserveProjectUserIds(existingProject, nextRoles) {
    const previousRoles = getStoredListValue(existingProject.role_project)
    const previousUserIds = getStoredListValue(existingProject.id_user)

    return JSON.stringify(nextRoles.map((role) => {
        const previousIndex = previousRoles.indexOf(role)
        return previousIndex >= 0 ? previousUserIds[previousIndex] || '' : ''
    }))
}

function getStoredListValue(value) {
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value !== 'string') {
        return []
    }

    try {
        const parsedValue = JSON.parse(value)
        return Array.isArray(parsedValue) ? parsedValue : [value]
    } catch {
        return [value]
    }
}

async function attachProjectUserNames(projects) {
    const userIds = [...new Set(projects
        .flatMap((project) => getStoredListValue(project.id_user))
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0))]

    if (!userIds.length) {
        return projects.map((project) => ({
            ...project,
            role_project: getStoredListValue(project.role_project),
            id_user: getStoredListValue(project.id_user),
            nama_user: getStoredListValue(project.id_user).map(() => ''),
        }))
    }

    const users = await prisma.user.findMany({
        where: {
            id_user: {
                in: userIds,
            },
        },
        select: {
            id_user: true,
            nama_user: true,
        },
    })
    const userNameById = new Map(users.map((user) => [String(user.id_user), user.nama_user]))

    return projects.map((project) => {
        const assignedIds = getStoredListValue(project.id_user)
        return {
            ...project,
            role_project: getStoredListValue(project.role_project),
            id_user: assignedIds,
            nama_user: assignedIds.map((id) => (id ? userNameById.get(String(id)) || 'User tidak ditemukan' : '')),
        }
    })
}

function getApprovedStatus(tgl_mulai) {
    const today = new Date()
    const startDate = new Date(tgl_mulai)
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)

    return today >= startDate ? 'sedang dikerjakan' : 'belum dimulai'
}

async function syncProjectStatus(project) {
    if (project.status_project === 'menunggu approve') {
        return prisma.project.update({
            where: {
                id_project: project.id_project,
            },
            data: {
                status_project: 'pending',
            },
        })
    }

    if (!['belum dimulai', 'sedang dikerjakan'].includes(project.status_project)) {
        return project
    }

    const status_project = getApprovedStatus(project.tgl_mulai)
    if (project.status_project === status_project) {
        return project
    }

    return prisma.project.update({
        where: {
            id_project: project.id_project,
        },
        data: {
            status_project,
        },
    })
}

export const projectCreatePage = (req, res) => {
    setNoCache(res)

    if (!requireSponsor(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'sponsor', 'project-create.html'))
}

export const sponsorDetailProjectPage = (req, res) => {
    setNoCache(res)

    if (!requireSponsor(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'sponsor', 'detail-project.html'))
}

export const sponsorPengaturanPage = (req, res) => {
    setNoCache(res)
    if (!requireSponsor(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'sponsor', 'pengaturan.html'))
}

export const sponsorJadwalKalenderPage = (req, res) => {
    setNoCache(res)
    if (!requireSponsor(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'sponsor', 'jadwal-kalender.html'))
}

export const sponsorProfilFreelancePage = (req, res) => {
    setNoCache(res)
    if (!requireSponsor(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'sponsor', 'profil-freelance.html'))
}

function toNullableString(value) {
    const trimmed = String(value ?? '').trim()
    return trimmed === '' ? null : trimmed
}

function toNullableInt(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return null
    }

    const num = Number(value)
    return Number.isInteger(num) ? num : NaN
}

export async function updateSponsorProfile(req, res) {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const { nama_user, email, no_telp } = req.body

    if (!nama_user || !email) {
        return res.status(400).json({ message: 'Nama lengkap dan email wajib diisi.' })
    }

    try {
        const existing = await prisma.user.findFirst({
            where: {
                nama_user: { equals: nama_user },
                NOT: { id_user: session.id_user }
            }
        })
        if (existing) {
            return res.status(400).json({ message: 'Nama lengkap / username sudah digunakan.' })
        }

        const updatedUser = await prisma.user.update({
            where: { id_user: session.id_user },
            data: {
                nama_user,
                email,
                no_telp: no_telp || null
            },
            select: {
                id_user: true,
                nama_user: true,
                role_user: true,
                email: true,
                no_telp: true,
            }
        })

        // Keep existing projects' "pembuat" field synchronized after a rename,
        // since project ownership checks compare against nama_user.
        await prisma.project.updateMany({
            where: { pembuat: session.nama_user },
            data: { pembuat: updatedUser.nama_user },
        })

        res.cookie('auth_token', createSessionToken(updatedUser), {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 1000 * 60 * 60 * 8,
        })

        res.json({ message: 'Profil berhasil diperbarui.', user: updatedUser })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memperbarui profil.' })
    }
}

export async function getSponsorBusinessProfile(req, res) {
    const session = requireSponsorApi(req, res)
    if (!session) return

    try {
        const user = await prisma.user.findUnique({
            where: { id_user: session.id_user },
            select: {
                id_user: true,
                nama_user: true,
                role_user: true,
                email: true,
                no_telp: true,
                profil_usaha: true,
            },
        })

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memuat profil usaha.' })
    }
}

export async function updateSponsorBusinessProfile(req, res) {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const nama_usaha = String(req.body.nama_usaha || '').trim()
    const bidang_usaha = String(req.body.bidang_usaha || '').trim()

    if (!nama_usaha || !bidang_usaha) {
        return res.status(400).json({ message: 'Nama usaha dan bidang usaha wajib diisi.' })
    }

    const jumlah_karyawan = toNullableInt(req.body.jumlah_karyawan)
    const tahun_berdiri = toNullableInt(req.body.tahun_berdiri)

    if (Number.isNaN(jumlah_karyawan) || Number.isNaN(tahun_berdiri)) {
        return res.status(400).json({ message: 'Jumlah karyawan dan tahun berdiri harus berupa angka.' })
    }

    const data = {
        nama_usaha,
        bidang_usaha,
        jumlah_karyawan,
        tahun_berdiri,
        deskripsi_usaha: toNullableString(req.body.deskripsi_usaha),
        email_usaha: toNullableString(req.body.email_usaha),
        no_tlp_usaha: toNullableString(req.body.no_tlp_usaha),
        alamat_usaha: toNullableString(req.body.alamat_usaha),
    }

    try {
        const updatedProfile = await prisma.profil_usaha.upsert({
            where: { id_user: session.id_user },
            update: data,
            create: {
                id_user: session.id_user,
                ...data,
            },
        })

        res.json({ message: 'Informasi usaha berhasil diperbarui.', profile: updatedProfile })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memperbarui informasi usaha.' })
    }
}

export async function updateSponsorPassword(req, res) {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const password = String(req.body?.password || '')
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password baru harus terdiri dari minimal 8 karakter.' })
    }

    try {
        await prisma.user.update({
            where: { id_user: session.id_user },
            data: { password: await hashPassword(password) },
        })
        res.json({ message: 'Password berhasil diperbarui.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memperbarui password.' })
    }
}

export const getSponsorProject = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const dbProject = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!dbProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(dbProject, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat melihat detail project yang Anda buat.' })
        }

        const syncedProject = await syncProjectStatus(dbProject)
        const [project] = await attachProjectUserNames([syncedProject])

        res.json({ project })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const getSponsorProjectLaporan = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const project = await prisma.project.findUnique({
            where: {
                id_project,
            },
            select: {
                nama_project: true,
                pembuat: true,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(project, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat melihat laporan project yang Anda buat.' })
        }

        const laporan = await prisma.laporan.findMany({
            where: {
                nama_project: project.nama_project,
            },
            orderBy: {
                id_laporan: 'desc',
            },
        })

        res.json({ laporan })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data laporan gagal dimuat.' })
    }
}

export const updateSponsorProjectLaporanStatus = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    const id_laporan = Number(req.params.laporanId)
    if (!Number.isInteger(id_laporan) || id_laporan <= 0) {
        return res.status(400).json({ message: 'ID laporan tidak valid.' })
    }

    const { status } = req.body
    if (!['approve', 'ditolak'].includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid.' })
    }

    try {
        const project = await prisma.project.findUnique({
            where: {
                id_project,
            },
            select: {
                nama_project: true,
                pembuat: true,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(project, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat mengubah status laporan project yang Anda buat.' })
        }

        const existingLaporan = await prisma.laporan.findFirst({
            where: {
                id_laporan,
                nama_project: project.nama_project,
            },
        })

        if (!existingLaporan) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan.' })
        }

        const updatedLaporan = await prisma.laporan.update({
            where: {
                id_laporan,
            },
            data: {
                status_laporan: status,
            },
        })

        res.json({ message: 'Status laporan berhasil diperbarui.', laporan: updatedLaporan })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memperbarui status laporan.' })
    }
}

export const getSponsorProjectApplications = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const project = await prisma.project.findUnique({
            where: {
                id_project,
            },
            select: {
                pembuat: true,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(project, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat melihat aplikasi untuk project Anda.' })
        }

        const applications = await prisma.pendaftaran.findMany({
            where: {
                id_project,
            },
            orderBy: [
                { role_project: 'asc' },
                { status: 'asc' },
                { created_at: 'desc' },
            ],
            include: {
                user: {
                    select: {
                        id_user: true,
                        nama_user: true,
                        email: true,
                        cv: true,
                    },
                },
            },
        })

        res.json({ applications })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data aplikasi gagal dimuat.' })
    }
}

export const getSponsorFreelanceProfile = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_user = Number(req.params.id)
    if (!Number.isInteger(id_user) || id_user <= 0) {
        return res.status(400).json({ message: 'ID freelancer tidak valid.' })
    }

    try {
        // Sponsor hanya boleh melihat profil freelancer yang pernah mendaftar ke project miliknya.
        const hasApplied = await prisma.pendaftaran.findFirst({
            where: {
                id_user,
                project: {
                    pembuat: session.nama_user,
                },
            },
            select: {
                id_pendaftaran: true,
            },
        })

        if (!hasApplied) {
            return res.status(403).json({ message: 'Anda hanya dapat melihat profil freelancer yang mendaftar ke project Anda.' })
        }

        const user = await prisma.user.findUnique({
            where: {
                id_user,
            },
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                no_telp: true,
                cv: true,
                profil_freelance: true,
            },
        })

        if (!user) {
            return res.status(404).json({ message: 'Freelancer tidak ditemukan.' })
        }

        const selesaiProjects = await prisma.project.findMany({
            where: {
                status_project: 'selesai',
            },
            select: {
                id_user: true,
            },
        })

        const completedProjectCount = selesaiProjects.filter((project) => (
            getStoredListValue(project.id_user).map(String).includes(String(id_user))
        )).length

        res.json({ user, completedProjectCount })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memuat profil freelancer.' })
    }
}

export const approveSponsorProjectApplication = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    const id_pendaftaran = Number(req.params.applicationId)
    if (!Number.isInteger(id_pendaftaran) || id_pendaftaran <= 0) {
        return res.status(400).json({ message: 'ID aplikasi tidak valid.' })
    }

    try {
        const application = await prisma.pendaftaran.findUnique({
            where: {
                id_pendaftaran,
            },
            include: {
                project: true,
            },
        })

        if (!application) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' })
        }

        if (application.id_project !== id_project) {
            return res.status(400).json({ message: 'Aplikasi tidak sesuai dengan project.' })
        }

        const project = application.project
        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(project, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat menyetujui aplikasi untuk project Anda.' })
        }

        if (application.status !== 'pending') {
            return res.status(400).json({ message: 'Aplikasi sudah tidak dalam status pending.' })
        }

        const roles = getStoredListValue(project.role_project)
        const acceptedIds = getStoredListValue(project.id_user)

        while (acceptedIds.length < roles.length) {
            acceptedIds.push('')
        }

        const roleIndex = roles.indexOf(application.role_project)
        if (roleIndex === -1) {
            return res.status(400).json({ message: 'Role aplikasi tidak ditemukan di project.' })
        }

        if (String(acceptedIds[roleIndex] || '').trim() !== '') {
            return res.status(400).json({ message: 'Role ini sudah memiliki freelance yang disetujui.' })
        }

        acceptedIds[roleIndex] = String(application.id_user)

        const allFilled = acceptedIds.every((id) => String(id || '').trim() !== '')
        const status_project = allFilled ? getApprovedStatus(project.tgl_mulai) : 'pending'

        await prisma.$transaction([
            prisma.pendaftaran.update({
                where: {
                    id_pendaftaran,
                },
                data: {
                    status: 'approved',
                },
            }),
            prisma.pendaftaran.updateMany({
                where: {
                    id_project,
                    role_project: application.role_project,
                    status: 'pending',
                    NOT: {
                        id_pendaftaran,
                    },
                },
                data: {
                    status: 'rejected',
                },
            }),
            prisma.project.update({
                where: {
                    id_project,
                },
                data: {
                    id_user: JSON.stringify(acceptedIds),
                    status_project,
                },
            }),
        ])

        res.json({ message: 'Aplikasi berhasil disetujui.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal menyetujui aplikasi.' })
    }
}

export const createProject = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    try {
        const nama_project = String(req.body.nama_project || '').trim()
        const roleProjectList = parseProjectRoles(req.body.role_project)
        const bayaran = parseProjectPayment(req.body.bayaran)
        const tgl_mulai = parseProjectDate(req.body.tgl_mulai)
        const deadline = parseProjectDate(req.body.deadline)
        const deskripsi = String(req.body.deskripsi || '').trim()

        if (!nama_project || roleProjectList.length === 0 || bayaran === null || !tgl_mulai || !deadline || !deskripsi) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (deadline < tgl_mulai) {
            return res.status(400).json({ message: 'Deadline tidak boleh lebih awal dari tanggal mulai.' })
        }

        const roleProject = validateRoleProjectLength(roleProjectList, res)
        if (!roleProject) return

        const project = await prisma.project.create({
            data: {
                nama_project,
                pembuat: session.nama_user,
                id_user: buildEmptyProjectUserIds(roleProjectList),
                role_project: roleProject,
                bayaran,
                tgl_mulai,
                deadline,
                status_project: 'pending',
                deskripsi_project: deskripsi,
            },
        })

        res.status(201).json({
            message: 'Project berhasil dibuat.',
            redirectTo: '/page/sponsor/dashboard.html',
            project,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Project gagal dibuat.' })
    }
}

export const updateProject = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const nama_project = String(req.body.nama_project || '').trim()
        const roleProjectList = parseProjectRoles(req.body.role_project)
        const bayaran = parseProjectPayment(req.body.bayaran)
        const tgl_mulai = parseProjectDate(req.body.tgl_mulai)
        const deadline = parseProjectDate(req.body.deadline)
        const deskripsi = String(req.body.deskripsi || '').trim()

        if (!nama_project || roleProjectList.length === 0 || bayaran === null || !tgl_mulai || !deadline || !deskripsi) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (deadline < tgl_mulai) {
            return res.status(400).json({ message: 'Deadline tidak boleh lebih awal dari tanggal mulai.' })
        }

        const existingProject = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!existingProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(existingProject, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat mengupdate project yang Anda buat.' })
        }

        if (!pendingStatuses.has(existingProject.status_project)) {
            return res.status(400).json({ message: 'Project hanya dapat diupdate saat status pending.' })
        }

        const roleProject = validateRoleProjectLength(roleProjectList, res)
        if (!roleProject) return

        const data = {
            nama_project,
            id_user: preserveProjectUserIds(existingProject, roleProjectList),
            role_project: roleProject,
            bayaran,
            tgl_mulai,
            deadline,
            deskripsi_project: deskripsi,
            status_project: 'pending',
        }

        const project = await prisma.project.update({
            where: {
                id_project,
            },
            data,
        })

        res.json({
            message: 'Project berhasil diupdate.',
            project,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Project gagal diupdate.' })
    }
}

export const deleteProject = async (req, res) => {
    const session = requireSponsorApi(req, res)
    if (!session) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const existingProject = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!existingProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!isProjectOwner(existingProject, session)) {
            return res.status(403).json({ message: 'Anda hanya dapat menghapus project yang Anda buat.' })
        }

        if (!pendingStatuses.has(existingProject.status_project)) {
            return res.status(400).json({ message: 'Project hanya dapat dihapus saat status pending.' })
        }

        await prisma.project.delete({
            where: {
                id_project,
            },
        })

        res.json({ message: 'Project berhasil dihapus.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Project gagal dihapus.' })
    }
}