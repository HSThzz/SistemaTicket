/**
 * @file Configuração da aplicação Express e montagem de middlewares e rotas HTTP.
 * @module app
 */

import express from "express";
import path from "node:path";
import helmet from "helmet";
import { corsMiddleware } from "./shared/interfaces/http/middlewares/corsMiddleware";
import { globalRateLimiter } from "./shared/interfaces/http/middlewares/rateLimiter";
import { requestLogger } from "./shared/interfaces/http/middlewares/requestLogger";
import { errorHandler } from "./shared/interfaces/http/middlewares/errorHandler";
import routes from "./shared/interfaces/http/routes";

/**
 * Cria e configura a instância Express da API TicketFlow.
 * @returns Aplicação Express pronta para `listen` ou testes de integração.
 */
export function createApp(): express.Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());

  app.use(corsMiddleware);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );

  if (process.env.NODE_ENV !== "test") {
    app.use(globalRateLimiter);
  }

  app.use(requestLogger);

  // Assets públicos (logo Google Wallet). Precisam ser HTTPS acessíveis pelo Google.
  app.use(
    "/wallet-assets",
    express.static(path.resolve(process.cwd(), "assets", "wallet"), {
      maxAge: "7d",
      immutable: true,
      fallthrough: false,
    }),
  );

  app.use(routes);

  app.use(errorHandler);

  return app;
}
