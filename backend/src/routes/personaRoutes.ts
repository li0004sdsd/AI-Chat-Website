import { Router } from 'express';
import {
  getAllPersonas,
  getPersona,
  getPersonaCategories,
  getPersonasByCat,
} from '../controllers/personaController';

const router = Router();

router.get('/', getAllPersonas);
router.get('/categories', getPersonaCategories);
router.get('/category/:category', getPersonasByCat);
router.get('/:id', getPersona);

export default router;
