import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Tırnakları temizleyen yardımcı fonksiyon
const sanitizeEnv = (val: string | undefined) => {
    if (!val) return val;
    return val.replace(/['"]+/g, '').trim();
};

// Kritik değişkenleri temizle
if (process.env.DATABASE_URL) process.env.DATABASE_URL = sanitizeEnv(process.env.DATABASE_URL);
if (process.env.REDIS_URL) process.env.REDIS_URL = sanitizeEnv(process.env.REDIS_URL);
if (process.env.PORT) process.env.PORT = sanitizeEnv(process.env.PORT);

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().url('Geçerli bir DB URL si girmelisiniz'),
    REDIS_URL: z.string().url('Geçerli bir Redis bağlantı noktası girmelisiniz'),
    JWT_SECRET: z.string().min(16, 'JWT Secret en az 16 karakter olmalıdır'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(16, 'Refresh Secret en az 16 karakter olmalıdır'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    OSRM_URL: z.string().url().default('http://localhost:5000'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    COOKIE_DOMAIN: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('❌ Geçersiz ortam değişkenleri (Env Vars):');
    console.error(parseResult.error.format());
    process.exit(1);
}

export const env = parseResult.data;
