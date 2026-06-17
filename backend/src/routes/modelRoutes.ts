import { Router } from 'express';
import {
  getModels,
  testModel,
  getModelConfigs,
  getModelConfig,
  saveModelConfig,
  removeModelConfig,
} from '../controllers/modelController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getModels);
router.post('/test', authMiddleware, testModel);

router.get('/configs', authMiddleware, getModelConfigs);
router.get('/configs/:provider', authMiddleware, getModelConfig);
router.put('/configs/:provider', authMiddleware, saveModelConfig);
router.delete('/configs/:provider', authMiddleware, removeModelConfig);

export default router;
