import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev_banana_quest_secret_key_change_in_production_2026',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  bananaApiUrl: process.env.BANANA_API_URL || 'https://marcconrad.com/uob/banana/api.php?out=json'
};
