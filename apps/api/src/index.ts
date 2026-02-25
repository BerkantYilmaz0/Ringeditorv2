import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';

async function bootstrap() {
    try {
        // 1. Veritabanı ve Kritik servis bağlantılarını Check et
        await prisma.$connect();
        logger.info('📦 PostgreSQL veritabanına bağlanıldı.');

        // 2. Server'ı kaldır
        const server = app.listen(env.PORT, () => {
            logger.info(`🚀 API servisi http://localhost:${env.PORT} üzerinde çalışıyor.`);
            logger.info(`👉 Ortam: ${env.NODE_ENV}`);
        });

        // 3. Graceful Shutdown Yönetimi (Docker vb. temiz kapanış)
        const gracefulShutdown = async (signal: string) => {
            logger.info(`🚨 ${signal} alındı. Graceful Shutdown başlatılıyor...`);
            server.close(() => {
                logger.info('Pcyi kapatıyoruz: HTTP requestler durduruldu...');
            });
            await prisma.$disconnect();
            logger.info('📦 Veritabanı bağlantısı sonlandırıldı.');
            process.exit(0);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('❌ Server başlatılırken kritik bir hata oluştu', error);
        process.exit(1);
    }
}

bootstrap();
