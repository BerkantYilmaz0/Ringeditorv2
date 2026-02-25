import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';

async function bootstrap() {
    try {
        logger.info('🚀 Uygulama başlatılıyor...');

        // 1. Veritabanı bağlantısını arka planda başlat (bloklama yapmasın)
        prisma.$connect()
            .then(() => logger.info('📦 PostgreSQL bağlantısı başarılı.'))
            .catch((err) => logger.error('❌ PostgreSQL bağlantı hatası:', err));

        // 2. Server'ı kaldır
        const server = app.listen(env.PORT, () => {
            logger.info(`✅ API servisi http://0.0.0.0:${env.PORT} üzerinde aktif.`);
            logger.info(`⚙️ Ortam: ${env.NODE_ENV}`);
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
