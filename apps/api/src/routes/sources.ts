import { Router } from "express";
import { listSources, seedSourcesFromConfig } from "../services/sourceService.js";

export const sourcesRouter = Router();

sourcesRouter.get("/", async (_request, response, next) => {
  try {
    response.json(await listSources());
  } catch (error) {
    next(error);
  }
});

sourcesRouter.post("/seed", async (_request, response, next) => {
  try {
    response.json(await seedSourcesFromConfig());
  } catch (error) {
    next(error);
  }
});
