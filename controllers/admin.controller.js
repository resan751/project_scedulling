import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { readSession, setNoCache } from './auth.controller.js'

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

function parseProjectDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
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
    if (project.status_project === 'menunggu approve') {
        return prisma.projects.update({
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

    return prisma.projects.update({
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

    if (!requireAdmin(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'admin', 'project-create.html'))
}

export const getProjectKaryawanOptions = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    try {
        const users = await prisma.user.findMany({
            where: {
                role: 'karyawan',
            },
            orderBy: {
                nama_karyawan: 'asc',
            },
            select: {
                id_user: true,
                nama_karyawan: true,
            },
        })

        res.json({ users })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data karyawan gagal dimuat.' })
    }
}

export const getProjects = async (req, res) => {
    if (!requireAdminApi(req, res)) return

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

export const createProject = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    try {
        const nama_project = String(req.body.nama_project || '').trim()
        const namaKaryawanList = Array.isArray(req.body.nama_karyawan)
            ? req.body.nama_karyawan.map((nama) => String(nama || '').trim()).filter(Boolean)
            : [String(req.body.nama_karyawan || '').trim()].filter(Boolean)
        const tgl_mulai = parseProjectDate(req.body.tgl_mulai)
        const deadline = parseProjectDate(req.body.deadline)
        const deskripsi = String(req.body.deskripsi || '').trim()
        const uniqueNamaKaryawan = [...new Set(namaKaryawanList)]

        if (!nama_project || uniqueNamaKaryawan.length === 0 || !tgl_mulai || !deadline || !deskripsi) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (deadline < tgl_mulai) {
            return res.status(400).json({ message: 'Deadline tidak boleh lebih awal dari tanggal mulai.' })
        }

        const validUsers = await prisma.user.findMany({
            where: {
                nama_karyawan: {
                    in: uniqueNamaKaryawan,
                },
                role: 'karyawan',
            },
            select: {
                nama_karyawan: true,
                role: true,
            },
        })
        const validNames = new Set(validUsers.map((user) => user.nama_karyawan))
        const invalidNames = uniqueNamaKaryawan.filter((nama) => !validNames.has(nama))

        if (invalidNames.length > 0) {
            return res.status(400).json({ message: 'Pilihan karyawan tidak valid.' })
        }

        const project = await prisma.projects.create({
            data: {
                nama_project,
                nama_karyawan: uniqueNamaKaryawan,
                tgl_mulai,
                deadline,
                status_project: 'pending',
                deskripsi,
            },
        })

        res.status(201).json({
            message: 'Project berhasil dibuat.',
            redirectTo: '/page/admin/dashboard.html',
            project,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Project gagal dibuat.' })
    }
}

export const updateProject = async (req, res) => {
    if (!requireAdminApi(req, res)) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const nama_project = String(req.body.nama_project || '').trim()
        const namaKaryawanList = Array.isArray(req.body.nama_karyawan)
            ? req.body.nama_karyawan.map((nama) => String(nama || '').trim()).filter(Boolean)
            : [String(req.body.nama_karyawan || '').trim()].filter(Boolean)
        const tgl_mulai = parseProjectDate(req.body.tgl_mulai)
        const deadline = parseProjectDate(req.body.deadline)
        const deskripsi = String(req.body.deskripsi || '').trim()
        const uniqueNamaKaryawan = [...new Set(namaKaryawanList)]

        if (!nama_project || uniqueNamaKaryawan.length === 0 || !tgl_mulai || !deadline || !deskripsi) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' })
        }

        if (deadline < tgl_mulai) {
            return res.status(400).json({ message: 'Deadline tidak boleh lebih awal dari tanggal mulai.' })
        }

        const existingProject = await prisma.projects.findUnique({
            where: {
                id_project,
            },
        })

        if (!existingProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!pendingStatuses.has(existingProject.status_project)) {
            return res.status(400).json({ message: 'Project hanya dapat diupdate sebelum di-approve manager.' })
        }

        const validUsers = await prisma.user.findMany({
            where: {
                nama_karyawan: {
                    in: uniqueNamaKaryawan,
                },
                role: 'karyawan',
            },
            select: {
                nama_karyawan: true,
            },
        })
        const validNames = new Set(validUsers.map((user) => user.nama_karyawan))
        const invalidNames = uniqueNamaKaryawan.filter((nama) => !validNames.has(nama))

        if (invalidNames.length > 0) {
            return res.status(400).json({ message: 'Pilihan karyawan tidak valid.' })
        }

        const data = {
            nama_project,
            nama_karyawan: uniqueNamaKaryawan,
            tgl_mulai,
            deadline,
            deskripsi,
            status_project: 'pending',
        }

        const project = await prisma.projects.update({
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
    if (!requireAdminApi(req, res)) return

    const id_project = getProjectId(req, res)
    if (!id_project) return

    try {
        const existingProject = await prisma.projects.findUnique({
            where: {
                id_project,
            },
        })

        if (!existingProject) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (!pendingStatuses.has(existingProject.status_project)) {
            return res.status(400).json({ message: 'Project hanya dapat dihapus sebelum di-approve manager.' })
        }

        await prisma.projects.delete({
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
