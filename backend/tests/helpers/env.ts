/**
 * Configuração de ambiente para testes — deve ser importada antes de `src/`.
 * Força Redis local no DB 1 e ignora REDIS_URL do `.env` de desenvolvimento.
 */
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret";
process.env.PAYMENT_GATEWAY = "simulated";
process.env.DB_HOST = process.env.DB_HOST ?? "localhost";
process.env.DB_PORT = process.env.DB_PORT ?? "5432";
process.env.DB_USERNAME = process.env.DB_USERNAME ?? "postgres";
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? "postgres";
process.env.DB_DATABASE = process.env.DB_DATABASE ?? "app_db";
process.env.REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
process.env.REDIS_PORT = process.env.REDIS_PORT ?? "6379";
process.env.REDIS_DB = "1";
process.env.REDIS_URL = "";

export const TEST_WEBHOOK_SECRET = "test-webhook-secret";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { sleep };
