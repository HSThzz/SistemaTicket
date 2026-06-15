/**
 * @file Configuração do TypeORM DataSource (PostgreSQL).
 * @module shared/infrastructure/config/data-source
 */

import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import {
  Event,
  Order,
  Reservation,
  Ticket,
  TicketLot,
  User,
  UserFavorite,
} from "../persistence/entities";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const databaseUrl = process.env.DATABASE_URL?.trim();
const useConnectionUrl = Boolean(databaseUrl);
const requiresSsl =
  useConnectionUrl &&
  (isProduction ||
    databaseUrl!.includes("supabase") ||
    databaseUrl!.includes("railway") ||
    databaseUrl!.includes("rlwy.net") ||
    databaseUrl!.includes("sslmode=require"));

const postgresConfig = useConnectionUrl
  ? {
      type: "postgres" as const,
      url: databaseUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      type: "postgres" as const,
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? "5432"),
      username: process.env.DB_USERNAME ?? "postgres",
      password: process.env.DB_PASSWORD ?? "postgres",
      database: process.env.DB_DATABASE ?? "app_db",
      ssl: false,
    };

/**
 * Fonte de dados TypeORM da aplicação com entidades e caminho de migrations.
 */
export const AppDataSource = new DataSource({
  ...postgresConfig,
  synchronize: false,
  logging: !isProduction && !isTest,
  entities: [User, Event, TicketLot, Reservation, Order, Ticket, UserFavorite],
  migrations: [`${__dirname}/../persistence/migrations/*.{ts,js}`],
});
