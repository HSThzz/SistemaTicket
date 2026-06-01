import express from "express";
import { corsMiddleware } from "./shared/interfaces/http/middlewares/corsMiddleware";
import { globalRateLimiter } from "./shared/interfaces/http/middlewares/rateLimiter";
import { requestLogger } from "./shared/interfaces/http/middlewares/requestLogger";
import routes from "./shared/interfaces/http/routes";

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
