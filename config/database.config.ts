import { registerAs } from '@nestjs/config';
import { config } from '../database/data-source';

export const databaseConfiguration = registerAs('database', () => config);
