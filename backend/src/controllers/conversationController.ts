import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createConversation,
  getConversationById,
  getConversationsByUser,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessagesByConversation,
} from '../models/conversation';
import { getPersonaById } from '../data/personas';
import { chatWithModel, ChatMessage } from '../services/aiService';
import { ModelProvider } from '../config';

export async function createNewConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { title, personaId, modelProvider, modelName } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = createConversation(
      userId,
      title || 'New Conversation',
      personaId,
      modelProvider || 'deepseek',
      modelName
    );

    const persona = personaId ? getPersonaById(personaId) : null;
    if (persona) {
      const systemPrompt = persona.systemPrompt;
      addMessage(conversation.id, 'system', systemPrompt);
    }

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversations = getConversationsByUser(userId);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = getConversationById(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const messages = getMessagesByConversation(id);

    res.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateConv(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, model_provider, model_name } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = getConversationById(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = updateConversation(id, { title, model_provider, model_name });

    res.json({
      message: 'Conversation updated successfully',
      conversation: updated,
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteConv(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = getConversationById(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const success = deleteConversation(id);

    if (success) {
      res.json({ message: 'Conversation deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty' });
      return;
    }

    const conversation = getConversationById(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const userMessage = addMessage(id, 'user', content);

    const messages = getMessagesByConversation(id);
    const chatMessages: ChatMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const provider = conversation.model_provider as ModelProvider;
    const aiResponse = await chatWithModel(provider, chatMessages, conversation.model_name || undefined);

    const assistantMessage = addMessage(id, 'assistant', aiResponse.content);

    res.json({
      message: assistantMessage,
      model: aiResponse.model,
      provider: aiResponse.provider,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
}
