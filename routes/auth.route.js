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
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  userCreatePage,
  userUpdatePage,
} from '../controllers/manager.controller.js';

const AuthRouter = express.Router();

AuthRouter.get('/', loginPage)  
AuthRouter.get('/login.html', loginPage)
AuthRouter.get('/page/login.html', loginPage)

AuthRouter.post('/api/login', login)
AuthRouter.post('/api/logout', logout)
AuthRouter.get('/api/me', me)
AuthRouter.get('/api/users', getUsers)
AuthRouter.get('/api/users/:id', getUser)
AuthRouter.post('/api/users', createUser)
AuthRouter.put('/api/users/:id', updateUser)
AuthRouter.delete('/api/users/:id', deleteUser)

AuthRouter.get('/page/manager/user-create.html', userCreatePage)
AuthRouter.get('/page/manager/user-update.html', userUpdatePage)
AuthRouter.get('/page/manager/dashboard.html', dashboardPage('manager'))
AuthRouter.get('/page/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/page/karyawan/dashboard.html', dashboardPage('karyawan'))
AuthRouter.get('/manager/dashboard.html', dashboardPage('manager'))
AuthRouter.get('/admin/dashboard.html', dashboardPage('admin'))
AuthRouter.get('/karyawan/dashboard.html', dashboardPage('karyawan'))
AuthRouter.get(/^\/page\/(?!login\.html$).*/, protectedPageFallback)

export default AuthRouter
