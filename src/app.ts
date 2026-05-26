import express from "express";
import { corsMiddleware } from "./middlewares/corsMiddleware";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { requestLogger } from "./middlewares/requestLogger";
import routes from "./routes";

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
