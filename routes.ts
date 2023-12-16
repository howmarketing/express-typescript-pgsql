'use strict'
import { Application, Request, Response } from 'express';




export default function setupRoutes(app: Application, opts?: { port: number; host: string; }): void {
  // Setup routes, middleware, and handlers
  app.get('/', (req: Request, res: Response) => {
    const locals = {
      name: 'typescript_default',
      gabriel: 'testing',
      view: 'Some content or data to be displayed'
    };
    res.render('index', locals);
  });
}