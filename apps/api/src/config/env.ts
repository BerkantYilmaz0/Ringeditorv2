import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Railway "Raw Editor" kaynaklı tırnak işaretlerini (" ") temizle
Object.keys(process.env).forEach((key) => {
    const value = process.env[key];
    if (typeof value === 'string') {
        process.env[key] = value.replace(/['"]+/g, '').trim();
    }
});

// Eksik protokolleri (http/https) otomatik tamamla
if (process.env.CORS_ORIGIN && !process.env.CORS_ORIGIN.startsWith('http')) {
    process.env.CORS_ORIGIN = `https://${process.env.CORS_ORIGIN}`;
}
if (process.env.OSRM_URL && !process.env.OSRM_URL.startsWith('http')) {
    process.env.OSRM_URL = `https://${process.env.OSRM_URL}`;
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur'),
    REDIS_URL: z.string().min(1, 'REDIS_URL zorunludur'),
    JWT_SECRET: z.string().min(1, 'JWT Secret zorunludur'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(1, 'Refresh Secret zorunludur'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    OSRM_URL: z.string().min(1).default('https://router.project-osrm.org'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    COOKIE_DOMAIN: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('❌ Geçersiz ortam değişkenleri (Env Vars):');
    console.error(parseResult.error.format());
    process.exit(1);
}

export const env = parseResult.data;
