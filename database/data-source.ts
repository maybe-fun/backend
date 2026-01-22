import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const env = process.env;
export const config = {
  type: 'postgres',
  host: env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(env.DATABASE_PORT || '5432', 10),
  url: env.DATABASE_URL,
  synchronize: true,
  logging: env.APP_ENV !== 'production' ? 'all' : ['query', 'error'],
  username: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  migrationsRun: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  ...(env.DATABASE_SSL === 'true' ||
  (env.APP_ENV !== 'development' && env.DATABASE_SSL !== 'false')
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
};
export const dataSource = new DataSource(config as DataSourceOptions);
