import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/api/init-user-role', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  // No-op mock for metadata update
  console.log(`[Mock Server] Initializing user ${userId} with default role 'colaborador'`);
  return res.json({ success: true, role: 'colaborador' });
});

app.listen(PORT, () => {
  console.log(`[Mock Server] Proxy backend running on port ${PORT}`);
});
