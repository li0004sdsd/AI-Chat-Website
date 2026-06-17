import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './database.sqlite',

  models: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    },
  },
};

export type ModelProvider = keyof typeof config.models;
