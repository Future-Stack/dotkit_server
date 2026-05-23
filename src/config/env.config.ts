import { registerAs } from '@nestjs/config';

export interface IEnv {
    APPLICATION: {
        NODE_ENV: string;
        PORT: string;
        API_PREFIX: string;
        APP_NAME: string;
        APP_URL: string;
    },
    DATABASE: {
        DATABASE_URL: string;
        DATABASE_POOL_MIN: string;
        DATABASE_POOL_MAX: string;
    },
    JWT_CONFIG: {
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;
        JWT_REFRESH_SECRET: string;
        JWT_REFRESH_EXPIRES_IN: string;
    },
    SMTP_EMAIL_CONFIG: {
        EMAIL_HOST: string;
        EMAIL_PORT: string;
        EMAIL_USER: string;
        EMAIL_PASSWORD: string;
        EMAIL_FROM: string;
        EMAIL_FROM_NAME: string;
    },
    CLOUDINARY_CONFIG: {
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    },
    PAYMENT: {
        PLATFORM_FEE_PERCENTAGE: string;
        PLATFORM_TAX_PERCENTAGE: string;
    },
    ADMIN_CONFIG: {
        SUPER_ADMIN_EMAIL: string;
        SUPER_ADMIN_PASSWORD: string;
    },
    EXTERNAL_APIS: {
        GOOGLE_MAPS_API_KEY?: string;
        RENTCAST_API_KEY?: string;
        /** FBI Crime Data API key — obtain free at https://api.data.gov/signup/ */
        FBI_API_KEY?: string;
        HUD_API_TOKEN?: string;
    }
}

const requiredEnv = ["NODE_ENV", "PORT", "API_PREFIX", "APP_NAME", "APP_URL", "DATABASE_URL", "DATABASE_POOL_MIN", "DATABASE_POOL_MAX", "JWT_SECRET", "JWT_EXPIRES_IN", "JWT_REFRESH_SECRET", "JWT_REFRESH_EXPIRES_IN", "EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_FROM", "EMAIL_FROM_NAME", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "PLATFORM_FEE_PERCENTAGE", "PLATFORM_TAX_PERCENTAGE", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD"];
// env Checker
function envChecker() {
    requiredEnv.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`❌ Missing required env: ${key}`);
        }
    });
}

export default registerAs('env', (): IEnv => {
    envChecker();

    return {
        APPLICATION: {
            NODE_ENV: process.env.NODE_ENV as string,
            PORT: process.env.PORT as string,
            API_PREFIX: process.env.API_PREFIX as string,
            APP_NAME: process.env.APP_NAME as string,
            APP_URL: process.env.APP_URL as string,
        },
        DATABASE: {
            DATABASE_URL: process.env.DATABASE_URL as string,
            DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN as string,
            DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX as string
        },
        JWT_CONFIG: {
            JWT_SECRET: process.env.JWT_SECRET as string,
            JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
            JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
            JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as string,
        },
        SMTP_EMAIL_CONFIG: {
            EMAIL_HOST: process.env.EMAIL_HOST as string,
            EMAIL_PORT: process.env.EMAIL_PORT as string,
            EMAIL_USER: process.env.EMAIL_USER as string,
            EMAIL_PASSWORD: process.env.EMAIL_PASSWORD as string,
            EMAIL_FROM: process.env.EMAIL_FROM as string,
            EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME as string,
        },
        CLOUDINARY_CONFIG: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
        },
        PAYMENT: {
            PLATFORM_FEE_PERCENTAGE: process.env.PLATFORM_FEE_PERCENTAGE as string,
            PLATFORM_TAX_PERCENTAGE: process.env.PLATFORM_TAX_PERCENTAGE as string
        },
        ADMIN_CONFIG: {
            SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
            SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
        },
        // External APIs are optional — server boots without them, endpoints return graceful fallback
        EXTERNAL_APIS: {
            GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
            RENTCAST_API_KEY: process.env.RENTCAST_API_KEY,
            FBI_API_KEY: process.env.FBI_API_KEY,
            HUD_API_TOKEN: process.env.HUD_API_TOKEN,
        }
    };
});