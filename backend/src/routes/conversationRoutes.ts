import { Router } from 'express';
import {
  createNewConversation,
  getUserConversations,
  getConversation,
  updateConv,
  deleteConv,
  sendMessage,
} from '../controllers/conversationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createNewConversation);
router.get('/', getUserConversations);
router.get('/:id', getConversation);
router.put('/:id', updateConv);
router.delete('/:id', deleteConv);
router.post('/:id/messages', sendMessage);

export default router;
