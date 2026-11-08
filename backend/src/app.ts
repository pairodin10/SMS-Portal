import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import smsRoutes from './routes/smsRoutes';
import userRoutes from './routes/userRoutes';
import apiClientRoutes from './routes/apiClientRoutes';
import smsServerRoutes from './routes/smsServerRoutes';
import settingCoverageRoutes from './routes/settingCoverageRoutes';
import imeiSettingsRoutes from './routes/imeiSettingsRoutes';
import announcementRoutes from './routes/announcementRoutes';
import voiceServerRoutes from './routes/voiceServerRoutes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { testDatabaseConnection } from './config/database';

const app = express();

const clientOrigin = new URL(env.clientUrl);
const allowedClientOrigins = new Set([env.clientUrl]);
if (clientOrigin.hostname === 'localhost') {
  clientOrigin.hostname = '127.0.0.1';
  allowedClientOrigins.add(clientOrigin.origin);
} else if (clientOrigin.hostname === '127.0.0.1') {
  clientOrigin.hostname = 'localhost';
  allowedClientOrigins.add(clientOrigin.origin);
}

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedClientOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', async (_req, res) => {
  const dbStatus = await testDatabaseConnection();

  res.status(dbStatus.connected ? 200 : 503).json({
    success: dbStatus.connected,
    message: dbStatus.connected ? 'SMS Management API is running' : 'Database connection is unavailable',
    database: dbStatus,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/api-clients', apiClientRoutes);
app.use('/api/sms-servers', smsServerRoutes);
app.use('/api/setting-coverages', settingCoverageRoutes);
app.use('/api/imei-settings', imeiSettingsRoutes);
app.use('/api/voice-servers', voiceServerRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;
