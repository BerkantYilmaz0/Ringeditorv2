import morgan, { StreamOptions } from 'morgan';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Winston için morgan çıktısını yönlendirecek stream
const stream: StreamOptions = {
    // Morgan logları her satırın sonuna \n koyduğu için trimliyoruz
    write: (message: string) => logger.info(message.trim()),
};

// Morgan log seviyesi ve detayı ortama göre değişir
// Development ortamında renklendirilmiş (dev) çıktı, Production ortamında daha detaylı (combined)
const format = env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const morganMiddleware = morgan(format, { stream });
