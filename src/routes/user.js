import express from 'express';
import  User  from '../controllers/user.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/createUser', User.UserCreate);
router.post('/verify-email', User.verifyEmail);
router.post('/login', User.loginUser);
router.post('/logout', User.logoutUser);
router.put('/update-displayname', userAuth, User.updateDisplayName);
router.put('/update-password', userAuth, User.updatePassword);
router.post('/forgot-password', User.forgotPassword);
router.post('/reset-password', User.resetPassword);

export default router;