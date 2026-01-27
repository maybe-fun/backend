import * as process from 'process';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  // Admin SDK credentials
  privateKey: string;
  clientEmail: string;
}

export default function configuration() {
  return {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.APP_ENV,
    url: process.env.BASE_URL,
    name: process.env.APP_NAME ?? 'Maybe-fun',
    client: { url: process.env.CLIENT_URL },
    auth: {
      secret: process.env.JWT_SECRET,
      expiresIn: parseInt(process.env.JWT_ACCESS_TTL || '3600000', 10),
      refreshExpiresIn: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      // db: process.env.REDIS_DB,
      password: process.env.REDIS_PASSWORD,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
    },
    services: {
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        // Admin SDK credentials
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      } as FirebaseConfig,
    },
    mail: {
      from: process.env.MAIL_FROM,
      from_name: process.env.MAIL_FROM_NAME,
    },
  };
}

export * from './database.config';
export { dataSource } from '../database/data-source';
export { config } from '../database/data-source';
export { env } from '../database/data-source';
