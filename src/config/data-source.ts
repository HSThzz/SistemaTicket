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
} from "../entities";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? "5432"),
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_DATABASE ?? "app_db",
  synchronize: false,
  logging: !isProduction,
  entities: [User, Event, TicketLot, Reservation, Order, Ticket],
  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
});
