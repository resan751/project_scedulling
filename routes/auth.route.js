import express from 'express'
import {
  dashboardPage,
  login,
  loginPage,
  logout,
  me,
  protectedPageFallback,
} from '../controllers/auth.controller.js';
import {
  createProject,
  createUser,
  deleteProject,
  deleteUser,
  getUser,
  getUsers,
  getSponsorUsers,
  getProjects as getAdminProjects,
  getSponsorProject,
  getSponsorProjectLaporan,
  getProjectKaryawanOptions,
  kelolaUserPage,
  projectCreatePage,
  registerPage,
  registerUser,
  sponsorDetailProjectPage,
  updateProject,
  updateUser,
  userCreatePage,
  userUpdatePage,
} from '../controllers/admin.controller.js';
import {
  getProjects as getFreelanceProjects,
  getProject as getFreelanceProject,
  getProjectLaporan,
  registerProject,
  detailProjectPage,
  createLaporanPage,
  createLaporan,
} from '../controllers/freelance.controller.js';
import { upload } from '../config/multer.js'

const AuthRouter = express.Router();

AuthRouter.get('/', loginPage)  
AuthRouter.get('/login.html', loginPage)
AuthRouter.get('/page/login.html', loginPage)

AuthRouter.post('/api/login', login)
AuthRouter.post('/api/logout', logout)
AuthRouter.get('/api/me', me)
AuthRouter.post('/api/register', registerUser)
AuthRouter.get('/api/admin/users', getUsers)
AuthRouter.get('/api/sponsor/users', getSponsorUsers)
AuthRouter.get('/api/admin/users/:id', getUser)
AuthRouter.post('/api/admin/users', createUser)
AuthRouter.put('/api/admin/users/:id', updateUser)
AuthRouter.delete('/api/admin/users/:id', deleteUser)
AuthRouter.get('/api/project-karyawan', getProjectKaryawanOptions)
AuthRouter.get('/api/admin/projects', getAdminProjects)
AuthRouter.get('/api/sponsor/projects', getAdminProjects)
AuthRouter.get('/api/sponsor/projects/:id', getSponsorProject)
AuthRouter.get('/api/sponsor/projects/:id/laporan', getSponsorProjectLaporan)
AuthRouter.post('/api/sponsor/projects', createProject)
AuthRouter.put('/api/sponsor/projects/:id', updateProject)
AuthRouter.delete('/api/sponsor/projects/:id', deleteProject)
AuthRouter.get('/api/freelance/projects', getFreelanceProjects)
AuthRouter.get('/api/freelance/projects/:id', getFreelanceProject)
AuthRouter.get('/api/freelance/projects/:id/laporan', getProjectLaporan)
AuthRouter.post('/api/freelance/projects/:id/register', registerProject)

AuthRouter.get('/page/sponsor/project-create.html', projectCreatePage)
AuthRouter.get('/page/sponsor/detail-project.html', sponsorDetailProjectPage)
AuthRouter.get('/page/admin/kelola-user.html', kelolaUserPage)
AuthRouter.get('/page/admin/user-create.html', userCreatePage)
AuthRouter.get('/page/admin/user-update.html', userUpdatePage)
AuthRouter.get('/register.html', registerPage)
AuthRouter.get('/page/register.html', registerPage)
AuthRouter.get('/page/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/page/sponsor/dashboard.html', dashboardPage('sponsor'))
AuthRouter.get('/page/freelance/dashboard.html', dashboardPage('freelance'))
AuthRouter.get('/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/sponsor/dashboard.html', dashboardPage('sponsor'))
AuthRouter.get('/freelance/dashboard.html', dashboardPage('freelance'))
AuthRouter.get('/page/freelance/detail-project.html', detailProjectPage)
AuthRouter.get('/page/freelance/create-laporan.html', createLaporanPage)
AuthRouter.post('/api/freelance/laporan/create', upload.single('bukti'), createLaporan)
AuthRouter.get(/^\/page\/(?!login\.html$|register\.html$).*/, protectedPageFallback)

export default AuthRouter
