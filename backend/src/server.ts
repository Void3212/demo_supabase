import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import { createReservationRoutes } from './routes/reservations.js';
import { createProductRoutes } from './routes/products.js';
import { createReservationUnitRoutes } from './routes/reservationUnits.js';
import { createAdminSettingsRoutes } from './routes/adminSettings.js';
import { createSupportChatRoutes } from './routes/supportChat.js';
import { createWalkInRoutes } from './routes/walkins.js';
import { createUserRoutes } from './routes/users.js';
import ordersRouter from './routes/orders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://demo-supabase-dlor4786k-piernapascher-7357s-projects.vercel.app';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log('✓ Supabase connected');

    app.use('/api/reservations', createReservationRoutes());
    app.use('/api/products', createProductRoutes());
    app.use('/api/reservation-units', createReservationUnitRoutes());
    app.use('/api/admin-settings', createAdminSettingsRoutes());
    app.use('/api/support-chat', createSupportChatRoutes());
    app.use('/api/walkins', createWalkInRoutes());
    app.use('/api/users', createUserRoutes());
    app.use('/api/orders', ordersRouter);

    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use((_req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Frontend URL: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
