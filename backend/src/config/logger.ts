import pino, { type Logger as PinoLogger } from "pino";
import { env, isProduction } from "./env";

type LogData = Record<string, unknown>;

export class Logger {
  private static instance: Logger;
  private readonly pino: PinoLogger;

  private constructor() {
    this.pino = isProduction
      ? pino({ level: env.logLevel })
      : pino({
          level: env.logLevel,
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

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  get raw(): PinoLogger {
    return this.pino;
  }

  private withContext(context: string, data?: LogData): LogData {
    return { context: `[${context}]`, ...data };
  }

  trace(context: string, message: string, data?: LogData): void {
    this.pino.trace(this.withContext(context, data), message);
  }

  debug(context: string, message: string, data?: LogData): void {
    this.pino.debug(this.withContext(context, data), message);
  }

  info(context: string, message: string, data?: LogData): void {
    this.pino.info(this.withContext(context, data), message);
  }

  warn(context: string, message: string, data?: LogData): void {
    this.pino.warn(this.withContext(context, data), message);
  }

  error(context: string, message: string, data?: LogData): void {
    this.pino.error(this.withContext(context, data), message);
  }

  fatal(context: string, message: string, data?: LogData): void {
    this.pino.fatal(this.withContext(context, data), message);
  }
}
