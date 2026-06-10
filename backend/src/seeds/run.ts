/**
 * @file Script CLI para popular o ambiente com dados de demonstração.
 * @module seeds/run
 */

import "reflect-metadata";
import { AppDataSource } from "../shared/infrastructure/config/data-source";
import { getRedis, closeRedisConnections } from "../shared/infrastructure/config/redis";
import {
  resetDatabase,
  resetRedis,
  runDemoSeed,
  SEED_DEMO_EMAILS,
  SEED_PASSWORD,
} from "./demo-seed";

const CONTEXT = "Seed";

function printSummary(): void {
  console.log("\n========================================");
  console.log("  TicketFlow — dados de demonstração");
  console.log("========================================\n");
  console.log("Senha de todos os usuários:", SEED_PASSWORD);
  console.log("");
  console.log("| Papel    | E-mail                         |");
  console.log("|----------|--------------------------------|");
  console.log(`| ADMIN    | ${SEED_DEMO_EMAILS.admin.padEnd(30)} |`);
  console.log(`| PRODUCER | ${SEED_DEMO_EMAILS.producer.padEnd(30)} |`);
  console.log(`| CLIENT   | ${SEED_DEMO_EMAILS.client.padEnd(30)} |`);
  console.log("");
  console.log("Eventos publicados:");
  console.log("  • Festival TicketFlow 2026 (Pista + VIP)");
  console.log("  • Stand-up Comedy Night (Geral)");
  console.log("");
  console.log("Rascunho (painel produtor):");
  console.log("  • Workshop Dev (rascunho)");
  console.log("");
  console.log("Cliente demo já possui:");
  console.log("  • 2 ingressos ACTIVE (Festival — Pista) → /ingressos + QR");
  console.log("  • 1 ingresso USED (Comedy) → dashboard check-in");
  console.log("========================================\n");
}

function printConnectionHints(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`\n[${CONTEXT}] Dicas para Railway / remoto:`);
  console.error("  1. Use as variáveis do serviço: DATABASE_URL e REDIS_URL");
  console.error("  2. Local com Railway CLI: railway link && railway run npm run seed");
  console.error("  3. No container (após deploy): node dist/seeds/run.js");
  console.error("  4. Rode migrations antes: npm run migration:run");
  console.error(`\n[${CONTEXT}] Erro: ${message}`);
}

/**
 * Executa migrations pendentes, opcionalmente reseta DB/Redis e roda o seed demo.
 * Aceita `--keep` para não truncar dados existentes.
 */
async function main(): Promise<void> {
  const keepExisting = process.argv.includes("--keep");

  if (!process.env.DATABASE_URL?.trim() && !process.env.DB_HOST?.trim()) {
    throw new Error(
      "DATABASE_URL (Railway) ou DB_HOST não configurado. Defina as variáveis do Postgres.",
    );
  }

  if (!process.env.REDIS_URL?.trim() && !process.env.REDIS_HOST?.trim()) {
    throw new Error(
      "REDIS_URL (Railway) ou REDIS_HOST não configurado. O seed precisa do Redis para estoque.",
    );
  }

  console.log(`[${CONTEXT}] Connecting to database...`);
  await AppDataSource.initialize();

  const pendingMigrations = await AppDataSource.showMigrations();
  if (pendingMigrations) {
    console.log(`[${CONTEXT}] Running pending migrations...`);
    await AppDataSource.runMigrations();
  }

  console.log(`[${CONTEXT}] Connecting to Redis...`);
  const redis = getRedis();
  await redis.ping();

  if (!keepExisting) {
    console.log(`[${CONTEXT}] Resetting database and Redis...`);
    await resetDatabase(AppDataSource);
    await resetRedis(redis);
  } else {
    const { User } = await import("../shared/infrastructure/persistence/entities/User");
    const existingUsers = await AppDataSource.getRepository(User).count({
      where: { email: SEED_DEMO_EMAILS.admin },
    });

    if (existingUsers > 0) {
      console.log(
        `[${CONTEXT}] Demo users already exist. Omit --keep to reset and reseed.`,
      );
      process.exit(0);
    }
  }

  console.log(`[${CONTEXT}] Seeding demo data...`);
  const summary = await runDemoSeed(AppDataSource, redis);

  console.log(`[${CONTEXT}] Done.`);
  console.log(`  Users: ${summary.users.length}`);
  console.log(`  Events: ${summary.events.length}`);
  console.log(`  Sample tickets: ${summary.sampleTickets}`);

  printSummary();

  await AppDataSource.destroy();
  await closeRedisConnections();
}

main().catch((error) => {
  printConnectionHints(error);
  process.exit(1);
});
