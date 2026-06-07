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
  getProjects as getAdminProjects,
  getProjectKaryawanOptions,
  projectCreatePage,
  registerPage,
  registerUser,
  updateProject,
  updateUser,
  userCreatePage,
  userUpdatePage,
} from '../controllers/admin.controller.js';
import {
  getProjects as getFreelanceProjects,
  getProject as getFreelanceProject,
  registerProject,
  detailProjectPage,
} from '../controllers/freelance.controller.js';

const AuthRouter = express.Router();

AuthRouter.get('/', loginPage)  
AuthRouter.get('/login.html', loginPage)
AuthRouter.get('/page/login.html', loginPage)

AuthRouter.post('/api/login', login)
AuthRouter.post('/api/logout', logout)
AuthRouter.get('/api/me', me)
AuthRouter.post('/api/register', registerUser)
AuthRouter.get('/api/admin/users', getUsers)
AuthRouter.get('/api/admin/users/:id', getUser)
AuthRouter.post('/api/admin/users', createUser)
AuthRouter.put('/api/admin/users/:id', updateUser)
AuthRouter.delete('/api/admin/users/:id', deleteUser)
AuthRouter.get('/api/project-karyawan', getProjectKaryawanOptions)
AuthRouter.post('/api/projects', createProject)
AuthRouter.get('/api/admin/projects', getAdminProjects)
AuthRouter.put('/api/admin/projects/:id', updateProject)
AuthRouter.delete('/api/admin/projects/:id', deleteProject)
AuthRouter.get('/api/freelance/projects', getFreelanceProjects)
AuthRouter.get('/api/freelance/projects/:id', getFreelanceProject)
AuthRouter.post('/api/freelance/projects/:id/register', registerProject)

AuthRouter.get('/page/admin/project-create.html', projectCreatePage)
AuthRouter.get('/page/admin/user-create.html', userCreatePage)
AuthRouter.get('/page/admin/user-update.html', userUpdatePage)
AuthRouter.get('/register.html', registerPage)
AuthRouter.get('/page/register.html', registerPage)
AuthRouter.get('/page/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/page/karyawan/dashboard.html', dashboardPage('freelance'))
AuthRouter.get('/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/karyawan/dashboard.html', dashboardPage('freelance'))
AuthRouter.get('/page/freelance/detail-project.html', detailProjectPage)
AuthRouter.get(/^\/page\/(?!login\.html$|register\.html$).*/, protectedPageFallback)

export default AuthRouter
