import { Router } from 'express';
import { getModels, testModel } from '../controllers/modelController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getModels);
router.post('/test', authMiddleware, testModel);

export default router;
