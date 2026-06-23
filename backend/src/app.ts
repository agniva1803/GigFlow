import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/lead.routes';
import seedRoutes from './routes/seed.routes';
import { notFound, errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'x-seed-secret'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Interactive API documentation — see backend/src/config/swagger.ts for the spec
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/seed', seedRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
