import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from './database.config';

export const AppDataSource = new DataSource({
  ...databaseConfig,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
