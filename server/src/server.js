import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`🍌 Banana Quest Server running on http://localhost:${config.port} [${config.nodeEnv}]`);
});
