import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './models/database';
import userRoutes from './routes/userRoutes';
import conversationRoutes from './routes/conversationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import modelRoutes from './routes/modelRoutes';
import personaRoutes from './routes/personaRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/personas', personaRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`API base: http://localhost:${config.port}/api`);
});

export default app;
