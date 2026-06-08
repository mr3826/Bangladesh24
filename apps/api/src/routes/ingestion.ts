import { Router } from "express";
import { ingestAllSources } from "../services/ingestionService.js";

export const ingestionRouter = Router();

ingestionRouter.post("/run", async (_request, response, next) => {
  try {
    response.json(await ingestAllSources());
  } catch (error) {
    next(error);
  }
});
