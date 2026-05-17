import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { hashPassword, normalizeRole, readSession, setNoCache } from './auth.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function requireManager(req, res) {
    const session = readSession(req)
    if (!session) {
        res.redirect('/login.html')
        return null
    }

    if (session.role !== 'manager') {
        res.status(403).send('Akses ditolak. Halaman ini hanya untuk manager.')
        return null
    }

    return session
}

function requireManagerApi(req, res) {
    const session = readSession(req)
    if (!session) {
        res.status(401).json({ message: 'Belum login.' })
        return null
    }

    if (session.role !== 'manager') {
        res.status(403).json({ message: 'Akses ditolak. Hanya manager yang dapat membuat user.' })
        return null
    }

    return session
}

function getUserId(req, res) {
    const id_user = Number(req.params.id)
    if (!Number.isInteger(id_user) || id_user <= 0) {
        res.status(400).json({ message: 'ID user tidak valid.' })
        return null
    }

    return id_user
}

function getProjectId(req, res) {
    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        res.status(400).json({ message: 'ID project tidak valid.' })
        return null
    }

    return id_project
}

function getApprovedStatus(tgl_mulai) {
    const today = new Date()
    const startDate = new Date(tgl_mulai)
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)

    return today >= startDate ? 'sedang dikerjakan' : 'belum dimulai'
}

async function syncProjectStatus(project) {
    if (!['belum dimulai', 'sedang dikerjakan'].includes(project.status_project)) {
        return project
    }

    const status_project = getApprovedStatus(project.tgl_mulai)
    if (project.status_project === status_project) {
        return project
    }

    return prisma.projects.update({
        where: {
            id_project: project.id_project,
        },
        data: {
            status_project,
        },
    })
}

export const userCreatePage = (req, res) => {
    setNoCache(res)

    if (!requireManager(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'manager', 'user-create.html'))
}

export const userUpdatePage = (req, res) => {
    setNoCache(res)

    if (!requireManager(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'manager', 'user-update.html'))
}

export const getUsers = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    try {
        const users = await prisma.user.findMany({
            orderBy: {
                id_user: 'asc',
            },
            select: {
                id_user: true,
                nama_karyawan: true,
                email: true,
                role: true,
            },
        })

        res.json({ users })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data karyawan gagal dimuat.' })
    }
}

export const getUser = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    const id_user = getUserId(req, res)
    if (!id_user) return

    try {
        const user = await prisma.user.findUnique({
            where: {
                id_user,
            },
            select: {
                id_user: true,
                nama_karyawan: true,
                email: true,
                role: true,
            },
        })

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        res.json({ user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data user gagal dimuat.' })
    }
}

export const createUser = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    try {
        const nama_karyawan = String(req.body.nama_karyawan || '').trim()
        const email = String(req.body.email || '').trim()
        const password = String(req.body.password || '')
        const role = normalizeRole(req.body.role)
        const validRoles = new Set(['manager', 'admin', 'karyawan'])

        if (!nama_karyawan || !email || !password || !role) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (!validRoles.has(role)) {
            return res.status(400).json({ message: 'Role harus manager, admin, atau karyawan.' })
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { nama_karyawan },
                    { email },
                ],
            },
        })

        if (existingUser) {
            return res.status(409).json({ message: 'Nama karyawan atau email sudah digunakan.' })
        }

        const user = await prisma.user.create({
            data: {
                nama_karyawan,
                email,
                role,
                password: await hashPassword(password),
            },
            select: {
                id_user: true,
                nama_karyawan: true,
                email: true,
                role: true,
            },
        })

        res.status(201).json({
            message: 'User berhasil dibuat.',
            redirectTo: '/page/manager/dashboard.html',
            user,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'User gagal dibuat.' })
    }
}

export const updateUser = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    const id_user = getUserId(req, res)
    if (!id_user) return

    try {
        const nama_karyawan = String(req.body.nama_karyawan || '').trim()
        const email = String(req.body.email || '').trim()
        const password = String(req.body.password || '')
        const role = normalizeRole(req.body.role)
        const validRoles = new Set(['manager', 'admin', 'karyawan'])

        if (!nama_karyawan || !email || !role) {
            return res.status(400).json({ message: 'Nama karyawan, email, dan role wajib diisi.' })
        }

        if (!validRoles.has(role)) {
            return res.status(400).json({ message: 'Role harus manager, admin, atau karyawan.' })
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                id_user,
            },
        })

        if (!existingUser) {
            return res.status(404).json({ message: 'User tidak ditemukan.' })
        }

        const duplicateUser = await prisma.user.findFirst({
            where: {
                id_user: {
                    not: id_user,
                },
                OR: [
                    { nama_karyawan },
                    { email },
                ],
            },
        })

        if (duplicateUser) {
            return res.status(409).json({ message: 'Nama karyawan atau email sudah digunakan.' })
        }

        const data = {
            nama_karyawan,
            email,
            role,
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
                nama_karyawan: true,
                email: true,
                role: true,
            },
        })

        res.json({
            message: 'User berhasil diupdate.',
            redirectTo: '/page/manager/dashboard.html',
            user,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'User gagal diupdate.' })
    }
}

export const deleteUser = async (req, res) => {
    if (!requireManagerApi(req, res)) return

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

export const getProjects = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    try {
        const projects = await prisma.projects.findMany({
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

        res.json({ projects: syncedProjects })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const approveProject = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const project = await prisma.projects.findUnique({
            where: {
                id_project,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (project.status_project !== 'menunggu approve') {
            return res.status(400).json({ message: 'Project ini tidak berada dalam status menunggu approve.' })
        }

        const updatedProject = await prisma.projects.update({
            where: {
                id_project,
            },
            data: {
                status_project: getApprovedStatus(project.tgl_mulai),
            },
        })

        res.json({
            message: 'Project berhasil di-approve.',
            project: updatedProject,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Project gagal di-approve.' })
    }
}

export const finishProject = async (req, res) => {
    if (!requireManagerApi(req, res)) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const project = await prisma.projects.findUnique({
            where: {
                id_project,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        const syncedProject = await syncProjectStatus(project)

        if (syncedProject.status_project !== 'sedang dikerjakan') {
            return res.status(400).json({ message: 'Hanya project yang sedang dikerjakan yang dapat diselesaikan.' })
        }

        const updatedProject = await prisma.projects.update({
            where: {
                id_project,
            },
            data: {
                status_project: 'selesai',
            },
        })

        res.json({
            message: 'Project berhasil diselesaikan.',
            project: updatedProject,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Status project gagal diubah.' })
    }
}
