import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../prisma/lib/prisma.js'
import { readSession, setNoCache } from './auth.controller.js'

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

        const projects = syncedProjects.map((project) => ({
            ...project,
            role_project: getListValue(project.role_project),
            nama_user: getListValue(project.nama_user),
        }))

        res.json({ projects })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const getProject = async (req, res) => {
    if (!requireFreelanceApi(req, res)) return

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

        const syncedProject = await syncProjectStatus(dbProject)

        const project = {
            ...syncedProject,
            role_project: getListValue(syncedProject.role_project),
            nama_user: getListValue(syncedProject.nama_user),
        }

        res.json({ project })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Data project gagal dimuat.' })
    }
}

export const registerProject = async (req, res) => {
    const session = requireFreelanceApi(req, res)
    if (!session) return

    const id_project = Number(req.params.id)
    if (!Number.isInteger(id_project) || id_project <= 0) {
        return res.status(400).json({ message: 'ID project tidak valid.' })
    }

    try {
        const project = await prisma.project.findUnique({
            where: {
                id_project,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        if (project.status_project !== 'pending') {
            return res.status(400).json({ message: 'Pendaftaran ditutup karena status project bukan pending.' })
        }

        const selectedRoles = req.body.roles // array of string role names
        if (!Array.isArray(selectedRoles) || selectedRoles.length === 0) {
            return res.status(400).json({ message: 'Pilih minimal satu role project.' })
        }

        const roles = getListValue(project.role_project)
        const freelancers = getListValue(project.nama_user)

        // Ensure freelancers array has the same length as roles
        while (freelancers.length < roles.length) {
            freelancers.push('')
        }

        // Validate roles
        for (const role of selectedRoles) {
            const index = roles.indexOf(role)
            if (index === -1) {
                return res.status(400).json({ message: `Role "${role}" tidak tersedia untuk project ini.` })
            }
            if (freelancers[index] !== '') {
                return res.status(400).json({ message: `Role "${role}" sudah diambil oleh freelance lain.` })
            }
        }

        // Update selected roles
        for (const role of selectedRoles) {
            const index = roles.indexOf(role)
            freelancers[index] = session.nama_user
        }

        // Check if all roles are now filled (no empty string/null)
        const allFilled = freelancers.every((name) => name && name.trim() !== '')

        let status_project = 'pending'
        if (allFilled) {
            status_project = getApprovedStatus(project.tgl_mulai)
        }

        const updatedProject = await prisma.project.update({
            where: {
                id_project,
            },
            data: {
                nama_user: JSON.stringify(freelancers),
                status_project,
            },
        })

        res.json({
            message: 'Berhasil mendaftar ke project.',
            project: {
                ...updatedProject,
                role_project: roles,
                nama_user: freelancers,
            },
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
        // Verify that the user is registered in the specified project with the specified role
        const project = await prisma.project.findUnique({
            where: {
                nama_project,
            },
        })

        if (!project) {
            return res.status(404).json({ message: 'Project tidak ditemukan.' })
        }

        const roles = getListValue(project.role_project)
        const freelancers = getListValue(project.nama_user)

        const roleIndex = roles.indexOf(role_project)
        if (roleIndex === -1) {
            return res.status(400).json({ message: 'Role project tidak ditemukan dalam project ini.' })
        }

        if (freelancers[roleIndex] !== session.nama_user) {
            return res.status(403).json({ message: 'Anda tidak terdaftar dalam role ini untuk project ini.' })
        }

        // Create laporan record
        const buktiPath = `/uploads/${req.file.filename}`

        const laporan = await prisma.laporan.create({
            data: {
                nama_project,
                nama_user: session.nama_user,
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
