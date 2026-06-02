/**
 * @file Worker periódico que reconcilia estoque Redis com PostgreSQL.
 * @module sales/infrastructure/workers/StockReconciliationWorker
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  StockReconciliationService,
  type StockReconciliationReport,
} from "../../application/StockReconciliationService";

const CONTEXT = "StockReconciliationWorker";

/**
 * Executa reconciliação de estoque em intervalo configurável.
 */
export class StockReconciliationWorker {
  private readonly logger = Logger.getInstance();
  private readonly service: StockReconciliationService;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastReport: StockReconciliationReport | null = null;
  private lastError: string | null = null;

  /**
   * @param dataSource - Conexão TypeORM.
   * @param redis - Cliente Redis.
   * @param intervalMs - Intervalo entre execuções automáticas.
   */
  constructor(
    dataSource: DataSource,
    _redis: Redis,
    private readonly intervalMs: number,
  ) {
    this.service = new StockReconciliationService(dataSource, _redis);
  }

  /**
   * Agenda a primeira execução e repetições periódicas.
   * @returns Promise resolvida após agendar o timer.
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    this.logger.info(CONTEXT, "Stock reconciliation worker started", {
      intervalMs: this.intervalMs,
    });

    void this.runOnce();

    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.intervalMs);
  }

  /**
   * Cancela o timer de reconciliação.
   * @returns Promise resolvida após parar o worker.
   */
  async stop(): Promise<void> {
    this.running = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.logger.info(CONTEXT, "Stock reconciliation worker stopped");
  }

  /** Indica se o worker está ativo. */
  isRunning(): boolean {
    return this.running;
  }

  /** Intervalo configurado entre execuções (ms). */
  getIntervalMs(): number {
    return this.intervalMs;
  }

  /** Último relatório bem-sucedido, se houver. */
  getLastReport(): StockReconciliationReport | null {
    return this.lastReport;
  }

  /** Última mensagem de erro, se a execução falhou. */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Executa reconciliação imediatamente (manual ou agendada).
   * @returns Relatório da execução.
   */
  async runOnce(): Promise<StockReconciliationReport> {
    try {
      const report = await this.service.reconcileAll();
      this.lastReport = report;
      this.lastError = null;
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      this.logger.error(CONTEXT, "Stock reconciliation failed", { error: message });
      throw error;
    }
  }
}
