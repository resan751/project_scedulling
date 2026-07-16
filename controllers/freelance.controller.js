import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { hashPassword, readSession, setNoCache, createSessionToken } from './auth.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function requireFreelance(req, res) {
    const session = readSession(req)
    if (!session) {
        res.redirect('/login.html')
        return null
    }

    if (session.role !== 'freelance') {
        res.status(403).send('Akses ditolak. Halaman ini hanya untuk freelance.')
        return null
    }

    return session
}

export const detailProjectPage = (req, res) => {
    setNoCache(res)

    if (!requireFreelance(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'detail-project.html'))
}

export const createLaporanPage = (req, res) => {
    setNoCache(res)

    if (!requireFreelance(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'create-laporan.html'))
}

export const listLaporanPage = (req, res) => {
    setNoCache(res)

    if (!requireFreelance(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'laporan.html'))
}

export const freelancePengaturanPage = (req, res) => {
    setNoCache(res)
    if (!requireFreelance(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'pengaturan.html'))
}

export const freelanceJadwalKalenderPage = (req, res) => {
    setNoCache(res)
    if (!requireFreelance(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'jadwal-kalender.html'))
}

export const profilSponsorPage = (req, res) => {
    setNoCache(res)
    if (!requireFreelance(req, res)) return
    res.sendFile(path.join(__dirname, '..', 'page', 'freelance', 'profil-sponsor.html'))
}

function requireFreelanceApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (session.role !== 'freelance') {
        res.status(403).json({ message: 'Akses ditolak. Hanya freelance yang dapat mengakses halaman ini.' })
        return null
    }

    return session
}

function getListValue(value) {
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

function requireSponsorViewerApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (session.role !== 'sponsor') {
        res.status(403).json({ message: 'Akses ditolak. Hanya sponsor yang dapat mengakses halaman ini.' })
        return null
    }

    return session
}

export async function getFreelanceProfileForSponsor(req, res) {
    const session = requireSponsorViewerApi(req, res)
    if (!session) return

    const freelanceUserId = Number(req.params.id)
    if (!Number.isInteger(freelanceUserId) || freelanceUserId <= 0) {
        return res.status(400).json({ message: 'ID freelancer tidak valid.' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id_user: freelanceUserId },
            select: {
                id_user: true,
                nama_user: true,
                role_user: true,
                email: true,
                no_telp: true,
                cv: true,
                profil_freelance: true,
            },
        })

        if (!user || user.role_user !== 'freelance') {
            return res.status(404).json({ message: 'Freelancer tidak ditemukan.' })
        }

        const completedProjects = await prisma.project.findMany({
            where: { status_project: 'selesai' },
            select: { id_user: true },
        })

        const completedProjectCount = completedProjects.filter((project) =>
            getListValue(project.id_user).some((id) => String(id) === String(freelanceUserId))
        ).length

        res.json({ user, completedProjectCount })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memuat profil freelance.' })
    }
}

export async function getSponsorProfileForFreelance(req, res) {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const sponsorUserId = Number(req.params.id)
    if (!Number.isInteger(sponsorUserId) || sponsorUserId <= 0) {
        return res.status(400).json({ message: 'ID sponsor tidak valid.' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id_user: sponsorUserId },
            select: {
                id_user: true,
                nama_user: true,
                role_user: true,
                email: true,
                no_telp: true,
                profil_usaha: true,
            },
        })

        if (!user || user.role_user !== 'sponsor') {
            return res.status(404).json({ message: 'Sponsor tidak ditemukan.' })
        }

        const projectCount = await prisma.project.count({
            where: { pembuat: user.nama_user },
        })

        res.json({ user, projectCount })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memuat profil sponsor.' })
    }
}

export async function getFreelanceProfile(req, res) {
    const session = requireFreelanceApi(req, res)
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
                cv: true,
                profil_freelance: true,
            },
        })

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memuat profil freelance.' })
    }
}

export async function updateFreelanceProfile(req, res) {
    const session = requireFreelanceApi(req, res)
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

        // Keep the display name on older reports synchronized after a rename.
        await prisma.laporan.updateMany({
            where: { id_user: session.id_user },
            data: { nama_user: updatedUser.nama_user },
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

export async function updateFreelanceProfessionalProfile(req, res) {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const { headline, bio, linkedin } = req.body

    try {
        const updatedProfile = await prisma.profil_freelance.upsert({
            where: { id_user: session.id_user },
            update: {
                headline: headline || null,
                bio: bio || null,
                linkedin: linkedin || null,
            },
            create: {
                id_user: session.id_user,
                headline: headline || null,
                bio: bio || null,
                linkedin: linkedin || null,
            }
        })

        res.json({ message: 'Profil profesional berhasil diperbarui.', profile: updatedProfile })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal memperbarui profil profesional.' })
    }
}

export async function updateFreelancePassword(req, res) {
    const session = requireFreelanceApi(req, res)
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

export async function uploadFreelanceCv(req, res) {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    if (!req.file) {
        return res.status(400).json({ message: 'File CV harus diunggah.' })
    }

    try {
        const cvPath = `/uploads/${req.file.filename}`
        const user = await prisma.user.update({
            where: { id_user: session.id_user },
            data: { cv: cvPath },
            select: { id_user: true, nama_user: true, cv: true },
        })

        res.json({ message: 'CV berhasil diunggah.', user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal mengunggah CV.' })
    }
}

async function attachProjectUserNames(projects) {
    const userIds = [...new Set(projects
        .flatMap((project) => getListValue(project.id_user))
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0))]

    if (!userIds.length) {
        return projects.map((project) => ({
            ...project,
            role_project: getListValue(project.role_project),
            id_user: getListValue(project.id_user),
            nama_user: getListValue(project.id_user).map(() => ''),
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
        const assignedIds = getListValue(project.id_user)
        return {
            ...project,
            role_project: getListValue(project.role_project),
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

    // Only sync if status is active (belum dimulai or sedang dikerjakan) and roles are fully filled
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

export const getProjects = async (req, res) => {
    if (!requireFreelanceApi(req, res)) return

    try {
        const dbProjects = await prisma.project.findMany({
            orderBy: [
                {
                    status_project: 'asc',
                },
                {
                    tgl_mulai: 'asc',
                },
                {
                    id_project: 'asc',
                },
            ],
        })

        const syncedProjects = await Promise.all(dbProjects.map(syncProjectStatus))

        const projects = await attachProjectUserNames(syncedProjects)

        res.json({ projects })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const getProject = async (req, res) => {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        return res.status(400).json({ message: 'ID project tidak valid.' })
    }

    try {
        const dbProject = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!dbProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        // Debug: log project and session info for troubleshooting frontend load failures
        try {
            console.log('[DEBUG] getProject called', { id_project, session, dbProjectExists: !!dbProject })
        } catch (e) {
            console.error('[DEBUG] failed to log getProject debug info', e)
        }

        const syncedProject = await syncProjectStatus(dbProject)

        const userApplications = await prisma.pendaftaran.findMany({
            where: {
                id_project,
                id_user: session.id_user,
            },
            select: {
                role_project: true,
                status: true,
            },
        })

        const normalizedApplications = userApplications.map((application) => ({
            role_project: String(application.role_project).trim(),
            status: application.status,
        }))

        const [project] = await attachProjectUserNames([syncedProject])

        // Find the sponsor (creator) ID
        const sponsorUser = await prisma.user.findUnique({
            where: { nama_user: project.pembuat },
            select: { id_user: true }
        })
        const id_sponsor = sponsorUser ? sponsorUser.id_user : null;

        res.json({ project: { ...project, userApplications: normalizedApplications, id_sponsor } })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const getProjectLaporan = async (req, res) => {
    if (!requireFreelanceApi(req, res)) return

    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        return res.status(400).json({ message: 'ID project tidak valid.' })
    }

    try {
        const project = await prisma.project.findUnique({
            where: {
                id_project,
            },
            select: {
                nama_project: true,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
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

export const getFreelanceLaporan = async (req, res) => {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    try {
        const laporan = await prisma.laporan.findMany({
            where: { id_user: session.id_user },
            orderBy: { id_laporan: 'desc' },
        })
        res.json({ laporan })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data laporan gagal dimuat.' })
    }
}

function parseSelectedRoles(rawRoles) {
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles]
    return [...new Set(roles
        .map((role) => String(role || '').trim())
        .filter(Boolean))]
}

export const registerProject = async (req, res) => {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        return res.status(400).json({ message: 'ID project tidak valid.' })
    }

    try {
        const rawProject = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!rawProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        const project = await syncProjectStatus(rawProject)
        if (project.status_project !== 'pending') {
            return res.status(400).json({ message: 'Pendaftaran ditutup karena status project bukan pending.' })
        }

        const normalizedSelectedRoles = parseSelectedRoles(req.body.roles)
        if (!normalizedSelectedRoles.length) {
            return res.status(400).json({ message: 'Pilih minimal satu role project.' })
        }

        const roles = getListValue(project.role_project).map((role) => String(role).trim())
        const acceptedIds = getListValue(project.id_user)

        while (acceptedIds.length < roles.length) {
            acceptedIds.push('')
        }

        const applications = []
        for (const role of normalizedSelectedRoles) {
            const roleIndex = roles.indexOf(role)
            if (roleIndex === -1) {
                return res.status(400).json({ message: `Role "${role}" tidak tersedia untuk project ini.` })
            }

            if (String(acceptedIds[roleIndex] || '').trim() !== '') {
                return res.status(400).json({ message: `Role "${role}" sudah memiliki freelance yang disetujui.` })
            }

            const existingApplication = await prisma.pendaftaran.findFirst({
                where: {
                    id_project,
                    id_user: session.id_user,
                    role_project: role,
                },
                orderBy: {
                    created_at: 'desc',
                },
            })

            if (existingApplication) {
                if (existingApplication.status === 'pending') {
                    return res.status(400).json({ message: `Anda sudah mengajukan role "${role}". Tunggu persetujuan sponsor.` })
                }

                if (existingApplication.status === 'approved') {
                    return res.status(400).json({ message: `Anda sudah diterima untuk role "${role}".` })
                }

                if (existingApplication.status === 'rejected') {
                    const updatedApplication = await prisma.pendaftaran.update({
                        where: {
                            id_pendaftaran: existingApplication.id_pendaftaran,
                        },
                        data: {
                            status: 'pending',
                        },
                    })
                    applications.push(updatedApplication)
                    continue
                }
            }

            const createdApplication = await prisma.pendaftaran.create({
                data: {
                    id_project,
                    id_user: session.id_user,
                    role_project: role,
                    status: 'pending',
                },
            })
            applications.push(createdApplication)
        }

        res.json({
            message: 'Pendaftaran berhasil diajukan. Tunggu persetujuan sponsor.',
            applications,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal mendaftar ke project.' })
    }
}

export const createLaporan = async (req, res) => {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const { nama_project, role_project, jenis_laporan, deskripsi_laporan } = req.body

    // Validation
    if (!nama_project || !role_project || !jenis_laporan || !deskripsi_laporan) {
        return res.status(400).json({ message: 'Semua field harus diisi.' })
    }

    if (!req.file) {
        return res.status(400).json({ message: 'File bukti harus diunggah.' })
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: {
                id_user: session.id_user,
            },
            select: {
                nama_user: true,
            },
        })

        if (!currentUser) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        // Verify that the user is registered in the specified project with the specified role
        const project = await prisma.project.findFirst({
            where: {
                nama_project,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        const roles = getListValue(project.role_project)
        const freelancerIds = getListValue(project.id_user)

        const roleIndex = roles.indexOf(role_project)
        if (roleIndex === -1) {
            return res.status(400).json({ message: 'Role project tidak ditemukan dalam project ini.' })
        }

        if (String(freelancerIds[roleIndex] || '') !== String(session.id_user)) {
            return res.status(403).json({ message: 'Anda tidak terdaftar dalam role ini untuk project ini.' })
        }

        // Create laporan record
        const buktiPath = `/uploads/${req.file.filename}`

        const laporan = await prisma.laporan.create({
            data: {
                nama_project,
                nama_user: currentUser.nama_user,
                id_user: session.id_user,
                role_project,
                bukti: buktiPath,
                jenis_laporan,
                deskripsi_laporan,
            },
        })

        res.json({
            message: 'Laporan berhasil dibuat.',
            laporan,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Gagal membuat laporan.' })
    }
}