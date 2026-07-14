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

/**
 * Seed demo é exclusivo para desenvolvimento/testes locais.
 * Recusa produção (NODE_ENV / Railway) para não popular o banco real.
 */
function assertLocalSeedOnly(): void {
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv === "production") {
    throw new Error(
      "Demo seed é só para ambiente local/testes. Recusando com NODE_ENV=production.",
    );
  }

  const railwayEnv = (
    process.env.RAILWAY_ENVIRONMENT ??
    process.env.RAILWAY_ENVIRONMENT_NAME ??
    ""
  )
    .trim()
    .toLowerCase();

  if (railwayEnv === "production") {
    throw new Error(
      "Demo seed é só para ambiente local/testes. Recusando no ambiente Railway de produção.",
    );
  }
}

function printSummary(): void {
  console.log("\n========================================");
  console.log("  VIBRA — dados de demonstração (local)");
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

  console.error(`\n[${CONTEXT}] Dicas (seed local):`);
  console.error("  1. Use Postgres/Redis do .env local (DB_HOST / REDIS_HOST ou URLs locais)");
  console.error("  2. Rode migrations antes: npm run migration:run");
  console.error("  3. Não use railway run / NODE_ENV=production — seed não roda em produção");
  console.error(`\n[${CONTEXT}] Erro: ${message}`);
}

/**
 * Executa migrations pendentes, opcionalmente reseta DB/Redis e roda o seed demo.
 * Aceita `--keep` para não truncar dados existentes.
 * Somente para desenvolvimento local — nunca em produção.
 */
async function main(): Promise<void> {
  assertLocalSeedOnly();

  const keepExisting = process.argv.includes("--keep");

  if (!process.env.DATABASE_URL?.trim() && !process.env.DB_HOST?.trim()) {
    throw new Error(
      "DATABASE_URL ou DB_HOST não configurado. Defina as variáveis do Postgres local.",
    );
  }

  if (!process.env.REDIS_URL?.trim() && !process.env.REDIS_HOST?.trim()) {
    throw new Error(
      "REDIS_URL ou REDIS_HOST não configurado. O seed precisa do Redis para estoque.",
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
