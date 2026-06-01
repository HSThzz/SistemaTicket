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

export const AppDataSource = new DataSource({
  ...postgresConfig,
  synchronize: false,
  logging: !isProduction && !isTest,
  entities: [User, Event, TicketLot, Reservation, Order, Ticket],
  migrations: [`${__dirname}/../persistence/migrations/*.{ts,js}`],
});
