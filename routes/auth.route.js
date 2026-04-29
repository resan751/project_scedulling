import express from 'express'
import { loginPage } from '../controllers/auth.controller.js';

const AuthRouter = express.Router();

AuthRouter.get('/', loginPage)  

export default AuthRouter

