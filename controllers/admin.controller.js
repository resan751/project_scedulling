import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { readSession, setNoCache } from './auth.controller.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
                status_project: 'menunggu approve',
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
