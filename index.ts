"use strict";
import express from "express";
import createError from "http-errors";
import path from "path";
import { renderFile as ejsRenderFile } from "ejs";
import pino from "pino";
import pinoHttp from "pino-http";
import routes from "./routes";

interface ServerOptions {
  port: number;
  host: string;
}

export const main = (options: ServerOptions, cb?: (err?: Error, app?: express.Application, server?: any) => void): void => {
  // Set default options
  const ready = cb || function () {};
  const opts = { ...options };

  const logger = pino();

  // Server state
  let server: any;
  let serverStarted = false;
  let serverClosing = false;

  // Setup error handling
  function unhandledError(err: Error): void {
    // Log the errors
    logger.error(err);

    // Only clean up once
    if (serverClosing) {
      return;
    }
    serverClosing = true;

    // If server has started, close it down
    if (serverStarted) {
      server.close(function () {
        process.exit(1);
      });
    }
  }
  process.on("uncaughtException", unhandledError);
  process.on("unhandledRejection", unhandledError);

  // Create the express app
  const app = express();

  // Template engine
  app.engine("html", ejsRenderFile);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "html");

  // Common middleware
  // app.use(/* ... */)
  app.use(pinoHttp({ logger }));

  // Register routes
  routes(app, opts);

  // Common error handlers
  app.use(function fourOhFourHandler(req, res, next) {
    next(createError(404, `Route not found: ${req.url}`));
  });
  app.use(function fiveHundredHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    if (err.status >= 500) {
      logger.error(err);
    }
    res.locals.name = "typescript_default";
    res.locals.error = err;
    res.status(err.status || 500).render("error");
  });

  // Start server
  server = app.listen(opts.port, opts.host, function (err?: Error) {
    if (err) {
      return ready(err, app, server);
    }

    // If some other error means we should close
    if (serverClosing) {
      return ready(new Error("Server was closed before it could start"));
    }

    serverStarted = true;
    const addr = server.address();
    logger.info(
      `Started at ${opts.host || (addr as any).host || "localhost"}:${(addr as any).port}`
    );
    ready(err, app, server);
  });
};
