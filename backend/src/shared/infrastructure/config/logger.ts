/**
 * @file Logger singleton baseado em Pino com contexto por módulo.
 * @module shared/infrastructure/config/logger
 */

import pino, { type Logger as PinoLogger } from "pino";
import { env, isProduction } from "./env";

type LogData = Record<string, unknown>;

/**
 * Encapsula o logger Pino com prefixo de contexto e níveis padronizados.
 */
export class Logger {
  private static instance: Logger;
  private readonly pino: PinoLogger;

  private constructor() {
    const baseOptions = {
      level: env.logLevel,
      // Label textual ajuda o Railway e outros agregadores a filtrar por severity.
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
    };

    this.pino = isProduction
      ? pino(baseOptions)
      : pino({
          ...baseOptions,
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        });
  }

  /**
   * Retorna a instância única do logger da aplicação.
   * @returns Instância singleton de `Logger`.
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Expõe o logger Pino bruto para integrações que exigem a API nativa.
   * @returns Instância Pino subjacente.
   */
  get raw(): PinoLogger {
    return this.pino;
  }

  /** Mescla contexto textual com dados estruturados do log. */
  private withContext(context: string, data?: LogData): LogData {
    return { context: `[${context}]`, ...data };
  }

  /**
   * Registra mensagem em nível trace.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  trace(context: string, message: string, data?: LogData): void {
    this.pino.trace(this.withContext(context, data), message);
  }

  /**
   * Registra mensagem em nível debug.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  debug(context: string, message: string, data?: LogData): void {
    this.pino.debug(this.withContext(context, data), message);
  }

  /**
   * Registra mensagem em nível info.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  info(context: string, message: string, data?: LogData): void {
    this.pino.info(this.withContext(context, data), message);
  }

  /**
   * Registra mensagem em nível warn.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  warn(context: string, message: string, data?: LogData): void {
    this.pino.warn(this.withContext(context, data), message);
  }

  /**
   * Registra mensagem em nível error.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  error(context: string, message: string, data?: LogData): void {
    this.pino.error(this.withContext(context, data), message);
  }

  /**
   * Registra mensagem em nível fatal.
   * @param context - Identificador do módulo ou fluxo.
   * @param message - Mensagem legível.
   * @param data - Campos estruturados opcionais.
   */
  fatal(context: string, message: string, data?: LogData): void {
    this.pino.fatal(this.withContext(context, data), message);
  }
}
