import express, { Application } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';

// Temel yapılar
import { corsMiddleware } from './middleware/cors.middleware';
import { morganMiddleware } from './middleware/morgan.middleware';
import { errorHandler } from './middleware/error.middleware';
import { activityLogger } from './middleware/activity.middleware';

// Routes
import apiRoutes from './routes';
import { rateLimiter } from './middleware/rate-limit.middleware';

export const app: Application = express();

// Nginx reverse proxy arkasında çalıştığı için X-Forwarded-For başlığına güven
app.set('trust proxy', 1);

// 1. Güvenlik ve Temel Katmanlar
app.use(helmet()); // Varsayılan güçlü HTTP koruma başlıkları
app.use(cookieParser());
app.use(corsMiddleware);

// HTTP İstek İzleme
app.use(morganMiddleware);

// 2. Parser Middleware'leri
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Parametre Kirliliği Koruması (Parserlardan sonra olmalı)
app.use(hpp());

// 3. Rate Limitleri
app.use(rateLimiter);

// 4. Aktivite Logu (route'lardan önce, authenticate sonrası çalışır)
app.use(activityLogger);

// 5. API Route'ları
app.use('/api/v1', apiRoutes);

// 5. Tanımsız Route Yönetimi
app.use('*', (req, res) => {
    res.status(404).json({
        statusCode: 404,
        error: {
            type: 'NOT_FOUND',
            description: `Aradığınız '${req.originalUrl}' endpoint'i mevcut değil`
        },
    });
});

// 6. Global Hata Yakalayıcı (En Sonda)
app.use(errorHandler);
