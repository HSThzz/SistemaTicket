import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { getRedis, closeRedisConnections } from "../config/redis";
import {
  resetDatabase,
  resetRedis,
  runDemoSeed,
  SEED_PASSWORD,
} from "./demo-seed";

const CONTEXT = "Seed";

function printSummary(): void {
  console.log("\n========================================");
  console.log("  TicketFlow — dados de demonstração");
  console.log("========================================\n");
  console.log("Senha de todos os usuários:", SEED_PASSWORD);
  console.log("");
  console.log("| Papel    | E-mail                    |");
  console.log("|----------|---------------------------|");
  console.log("| ADMIN    | admin@ticketflow.test     |");
  console.log("| PRODUCER | producer@ticketflow.test  |");
  console.log("| CLIENT   | client@ticketflow.test    |");
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
  console.log("");
  console.log("Front: http://localhost:5173");
  console.log("API:   http://localhost:3000");
  console.log("========================================\n");
}

async function main(): Promise<void> {
  const keepExisting = process.argv.includes("--keep");

  console.log(`[${CONTEXT}] Connecting to database...`);
  await AppDataSource.initialize();

  const pendingMigrations = await AppDataSource.showMigrations();
  if (pendingMigrations) {
    console.log(`[${CONTEXT}] Running pending migrations...`);
    await AppDataSource.runMigrations();
  }

  const redis = getRedis();
  await redis.ping();

  if (!keepExisting) {
    console.log(`[${CONTEXT}] Resetting database and Redis...`);
    await resetDatabase(AppDataSource);
    await resetRedis(redis);
  } else {
    const { User } = await import("../entities/User");
    const existingUsers = await AppDataSource.getRepository(User).count({
      where: { email: "admin@ticketflow.test" },
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
  console.error(`[${CONTEXT}] Failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
});
