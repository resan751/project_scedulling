import path from 'path'
import { fileURLToPath } from 'url'
import { createHmac, pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { prisma } from '../prisma/lib/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pbkdf2Async = promisify(pbkdf2)
const sessionSecret = process.env.SESSION_SECRET || 'project-scedulling-session-secret'
const roleRedirects = {
    manager: '/page/manager/dashboard.html',
    admin: '/page/admin/dashboard.html',
    karyawan: '/page/karyawan/dashboard.html',
}

function normalizeRole(role) {
    const normalized = String(role || '').trim().toLowerCase()
    return normalized === 'user' ? 'karyawan' : normalized
}

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((cookies, cookie) => {
        const [name, ...value] = cookie.trim().split('=')
        if (!name) return cookies

        cookies[name] = decodeURIComponent(value.join('='))
        return cookies
    }, {})
}

function signPayload(payload) {
    return createHmac('sha256', sessionSecret).update(payload).digest('base64url')
}

function createSessionToken(user) {
    const payload = Buffer.from(JSON.stringify({
        id_user: user.id_user,
        nama_karyawan: user.nama_karyawan,
        role: normalizeRole(user.role),
    })).toString('base64url')

    return `${payload}.${signPayload(payload)}`
}

function readSession(req) {
    const { auth_token: token } = parseCookies(req.headers.cookie)
    if (!token) return null

    const [payload, signature] = token.split('.')
    if (!payload || !signature || signPayload(payload) !== signature) return null

    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    } catch {
        return null
    }
}

async function verifyPassword(inputPassword, storedPassword) {
    if (!storedPassword) return false

    const parts = storedPassword.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
        return inputPassword === storedPassword
    }

    const [, iterationsText, salt, storedHash] = parts
    const iterations = Number(iterationsText)
    if (!Number.isInteger(iterations) || iterations <= 0) return false

    const inputHash = await pbkdf2Async(inputPassword, salt, iterations, 32, 'sha256')
    const storedHashBuffer = Buffer.from(storedHash, 'base64')

    return storedHashBuffer.length === inputHash.length && timingSafeEqual(storedHashBuffer, inputHash)
}

async function hashPassword(password) {
    const iterations = 100000
    const salt = randomBytes(16).toString('base64')
    const hash = await pbkdf2Async(password, salt, iterations, 32, 'sha256')

    return `pbkdf2$${iterations}$${salt}$${hash.toString('base64')}`
}

function setNoCache(res) {
    res.set('Cache-Control', 'no-store')
}

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

export const loginPage = (req, res) => {
    setNoCache(res)

    const session = readSession(req)
    if (session && roleRedirects[session.role]) {
        return res.redirect(roleRedirects[session.role])
    }

    res.sendFile(path.join(__dirname, '..', 'page', 'login.html'))
}

export const login = async (req, res) => {
    const { nama_karyawan, password } = req.body

    if (!nama_karyawan || !password) {
        return res.status(400).json({ message: 'Nama karyawan dan password wajib diisi.' })
    }

    const user = await prisma.user.findFirst({
        where: {
            nama_karyawan,
        },
    })

    if (!user || !(await verifyPassword(password, user.password))) {
        return res.status(401).json({ message: 'Nama karyawan atau password salah.' })
    }

    const role = normalizeRole(user.role)
    const redirectTo = roleRedirects[role]

    if (!redirectTo) {
        return res.status(403).json({ message: 'Role user tidak dikenali.' })
    }

    res.cookie('auth_token', createSessionToken(user), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 8,
    })

    res.json({
        message: 'Login berhasil.',
        redirectTo,
        user: {
            id_user: user.id_user,
            nama_karyawan: user.nama_karyawan,
            role,
        },
    })
}

export const logout = (req, res) => {
    res.clearCookie('auth_token', { path: '/' })
    res.json({ message: 'Logout berhasil.' })
}

export const me = (req, res) => {
    const session = readSession(req)
    if (!session) {
        return res.status(401).json({ message: 'Belum login.' })
    }

    res.json({ user: session })
}

export const dashboardPage = (role) => (req, res) => {
    setNoCache(res)

    const session = readSession(req)
    if (!session) {
        return res.redirect('/login.html')
    }

    if (session.role !== role) {
        return res.redirect(roleRedirects[session.role] || '/login.html')
    }

    res.sendFile(path.join(__dirname, '..', 'page', role, 'dashboard.html'))
}

export const userCreatePage = (req, res) => {
    setNoCache(res)

    if (!requireManager(req, res)) return

    res.sendFile(path.join(__dirname, '..', 'page', 'manager', 'user-create.html'))
}

export const createUser = async (req, res) => {
    if (!requireManagerApi(req, res)) return

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
        user,
    })
}

export const protectedPageFallback = (req, res) => {
    const session = readSession(req)
    if (!session) {
        return res.redirect('/login.html')
    }

    res.redirect(roleRedirects[session.role] || '/login.html')
}
