import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
