import express from 'express';
import { Register , isAuth, login, logout } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';

const userRouter = express.Router();

userRouter.post('/register', Register)
userRouter.post('/login', login)
userRouter.get('/is-auth',authUser, isAuth)
userRouter.get('/logout',authUser, logout)


export default userRouter;