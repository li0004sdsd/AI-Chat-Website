import { Router } from 'express';
import { register, login, getCurrentUser, updateProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);

export default router;
