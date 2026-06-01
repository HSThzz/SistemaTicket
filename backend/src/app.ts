/**
 * @file Configuração da aplicação Express e montagem de middlewares e rotas HTTP.
 * @module app
 */

import express from "express";
import { corsMiddleware } from "./shared/interfaces/http/middlewares/corsMiddleware";
import { globalRateLimiter } from "./shared/interfaces/http/middlewares/rateLimiter";
import { requestLogger } from "./shared/interfaces/http/middlewares/requestLogger";
import routes from "./shared/interfaces/http/routes";

/**
 * Cria e configura a instância Express da API TicketFlow.
 * @returns Aplicação Express pronta para `listen` ou testes de integração.
 */
export function createApp(): express.Application {
  const app = express();

  app.set("trust proxy", 1);
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
  app.use(routes);

  return app;
}
