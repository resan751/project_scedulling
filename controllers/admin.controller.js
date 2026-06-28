import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { hashPassword, normalizeRole, readSession, setNoCache } from './auth.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pendingStatuses = new Set(['pending', 'menunggu approve'])

function requireAdmin(req, res) {
    const session = readSession(req)
    if (!session) {
        res.redirect('/login.html')
        return null
    }

    if (session.role !== 'admin') {
        res.status(403).send('Akses ditolak. Halaman ini hanya untuk admin.')
        return null
    }

    return session
}

function requireAdminApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (session.role !== 'admin') {
        res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengelola project.' })
        return null
    }

    return session
}

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

function requireProjectViewerApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (!['admin', 'sponsor'].includes(session.role)) {
        res.status(403).json({ message: 'Akses ditolak. Hanya admin atau sponsor yang dapat melihat project.' })
        return null
    }

    return session
}

function isProjectOwner(project, session) {
    return String(project.pembuat || '').trim() === String(session.nama_user || '').trim()
}

function getUserId(req, res) {
    const id_user = Number(req.params.id)
    if (!Number.isInteger(id_user) || id_user <= 0) {
        res.status(400).json({ message: 'ID user tidak valid.' })
        return null
    }

    return id_user
}

function parseProjectDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function parseProjectPayment(value) {
    const bayaran = Number(value)
    return Number.isInteger(bayaran) && bayaran >= 0 ? bayaran : null
}

function getProjectId(req, res) {
    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        res.status(400).json({ message: 'ID project tidak valid.' })
        return null
    }

    return id_project
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

export const userCreatePage = (req, res) => {
    setNoCache(res)

    if (!requireAdmin(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'admin', 'user-create.html'))
}

export const userUpdatePage = (req, res) => {
    setNoCache(res)

    if (!requireAdmin(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'admin', 'user-update.html'))
}

export const kelolaUserPage = (req, res) => {
    setNoCache(res)

    if (!requireAdmin(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'admin', 'kelola-user.html'))
}

export const registerPage = (req, res) => {
    setNoCache(res)
    res.sendFile(path.join(__dirname, '..', 'page', 'register.html'))
}

export const getUsers = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    try {
        const dbUsers = await prisma.user.findMany({
            orderBy: {
                id_user: 'asc',
            },
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                role_user: true,
            },
        })
        const users = dbUsers.map((user) => ({
            id_user: user.id_user,
            nama_user: user.nama_user,
            email: user.email,
            role: normalizeRole(user.role_user),
        }))

        res.json({ users })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data user gagal dimuat.' })
    }
}

export const getSponsorUsers = async (req, res) => {
    if (!requireSponsorApi(req, res)) return

    try {
        const dbUsers = await prisma.user.findMany({
            select: {
                id_user: true,
                role_user: true,
            },
        })
        const users = dbUsers.map((user) => ({
            id_user: user.id_user,
            role: normalizeRole(user.role_user),
        }))

        res.json({ users })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ringkasan user gagal dimuat.' })
    }
}

export const getUser = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    const id_user = getUserId(req, res)
    if (!id_user) return

    try {
        const dbUser = await prisma.user.findUnique({
            where: {
                id_user,
            },
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                role_user: true,
            },
        })

        if (!dbUser) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        res.json({
            user: {
                id_user: dbUser.id_user,
                nama_user: dbUser.nama_user,
                email: dbUser.email,
                role: normalizeRole(dbUser.role_user),
            },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data user gagal dimuat.' })
    }
}

async function ensureUniqueUser(nama_user, email, ignoredId = null) {
    return prisma.user.findFirst({
        where: {
            ...(ignoredId
                ? {
                    id_user: {
                        not: ignoredId,
                    },
                }
                : {}),
            OR: [
                { nama_user },
                { email },
            ],
        },
    })
}

export const createUser = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    try {
        const nama_user = String(req.body.nama_user || '').trim()
        const email = String(req.body.email || '').trim()
        const password = String(req.body.password || '')
        const role = normalizeRole(req.body.role)
        const validRoles = new Set(['admin', 'sponsor', 'freelance'])

        if (!nama_user || !email || !password || !role) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (!validRoles.has(role)) {
            return res.status(400).json({ message: 'Role harus admin, sponsor, atau freelance.' })
        }

        const existingUser = await ensureUniqueUser(nama_user, email)
        if (existingUser) {
            return res.status(409).json({ message: 'Nama user atau email sudah digunakan.' })
        }

        const user = await prisma.user.create({
            data: {
                nama_user,
                email,
                role_user: role,
                password: await hashPassword(password),
            },
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                role_user: true,
            },
        })

        res.status(201).json({
            message: 'User berhasil dibuat.',
            redirectTo: '/page/admin/dashboard.html',
            user: {
                id_user: user.id_user,
                nama_user: user.nama_user,
                email: user.email,
                role: user.role_user,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'User gagal dibuat.' })
    }
}

export const registerUser = async (req, res) => {
    try {
        const nama_user = String(req.body.nama_user || '').trim()
        const email = String(req.body.email || '').trim()
        const password = String(req.body.password || '')
        const role = normalizeRole(req.body.role || req.body.role_user || 'freelance')
        const validRoles = new Set(['sponsor', 'freelance'])

        if (!nama_user || !email || !password || !role) {
            return res.status(400).json({ message: 'Nama user, email, password, dan role wajib diisi.' })
        }

        if (!validRoles.has(role)) {
            return res.status(400).json({ message: 'Role registrasi harus sponsor atau freelance.' })
        }

        const existingUser = await ensureUniqueUser(nama_user, email)
        if (existingUser) {
            return res.status(409).json({ message: 'Nama user atau email sudah digunakan.' })
        }

        const user = await prisma.user.create({
            data: {
                nama_user,
                email,
                role_user: role,
                password: await hashPassword(password),
            },
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                role_user: true,
            },
        })

        res.status(201).json({
            message: 'Registrasi berhasil. Silakan login.',
            redirectTo: '/login.html',
            user: {
                id_user: user.id_user,
                nama_user: user.nama_user,
                email: user.email,
                role: user.role_user,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Registrasi gagal.' })
    }
}

export const updateUser = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    const id_user = getUserId(req, res)
    if (!id_user) return

    try {
        const nama_user = String(req.body.nama_user || '').trim()
        const email = String(req.body.email || '').trim()
        const password = String(req.body.password || '')
        const role = normalizeRole(req.body.role)
        const validRoles = new Set(['admin', 'sponsor', 'freelance'])

        if (!nama_user || !email || !role) {
            return res.status(400).json({ message: 'Nama user, email, dan role wajib diisi.' })
        }

        if (!validRoles.has(role)) {
            return res.status(400).json({ message: 'Role harus admin, sponsor, atau freelance.' })
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                id_user,
            },
        })

        if (!existingUser) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        const duplicateUser = await ensureUniqueUser(nama_user, email, id_user)
        if (duplicateUser) {
            return res.status(409).json({ message: 'Nama user atau email sudah digunakan.' })
        }

        const data = {
            nama_user,
            email,
            role_user: role,
        }

        if (password) {
            data.password = await hashPassword(password)
        }

        const user = await prisma.user.update({
            where: {
                id_user,
            },
            data,
            select: {
                id_user: true,
                nama_user: true,
                email: true,
                role_user: true,
            },
        })

        res.json({
            message: 'User berhasil diupdate.',
            redirectTo: '/page/admin/dashboard.html',
            user: {
                id_user: user.id_user,
                nama_user: user.nama_user,
                email: user.email,
                role: user.role_user,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'User gagal diupdate.' })
    }
}

export const deleteUser = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    const id_user = getUserId(req, res)
    if (!id_user) return

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                id_user,
            },
        })

        if (!existingUser) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        await prisma.user.delete({
            where: {
                id_user,
            },
        })

        res.json({ message: 'User berhasil dihapus.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'User gagal dihapus.' })
    }
}

export const getProjectKaryawanOptions = async (req, res) => {
    if (!requireSponsorApi(req, res)) return

    try {
        const users = await prisma.user.findMany({
            where: {
                role_user: {
                    in: ['freelance', 'karyawan'],
                },
            },
            orderBy: {
                nama_user: 'asc',
            },
            select: {
                id_user: true,
                nama_user: true,
            },
        })

        res.json({ users })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data freelance gagal dimuat.' })
    }
}

export const getProjects = async (req, res) => {
    if (!requireProjectViewerApi(req, res)) return

    try {
        const projects = await prisma.project.findMany({
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
        const syncedProjects = await Promise.all(projects.map(syncProjectStatus))
        const hydratedProjects = await attachProjectUserNames(syncedProjects)

        res.json({ projects: hydratedProjects })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
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

        const roleProject = validateRoleProjectLength(roleProjectList, res)
        if (!roleProject) return

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
