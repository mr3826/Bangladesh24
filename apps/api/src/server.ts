import "./utils/env.js";
import { DEFAULT_API_PORT } from "@bangladesh24/shared";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { dashboardRouter } from "./routes/dashboard.js";
import { ingestionRouter } from "./routes/ingestion.js";
import { sourcesRouter } from "./routes/sources.js";
import { storiesRouter } from "./routes/stories.js";
import { workspacePath } from "./utils/workspace.js";

const app = express();
const port = Number(process.env.API_PORT ?? DEFAULT_API_PORT);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/outputs", express.static(workspacePath("outputs")));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    name: "Bangladesh24 API",
    time: new Date().toISOString()
  });
});

app.use("/sources", sourcesRouter);
app.use("/ingestion", ingestionRouter);
app.use("/stories", storiesRouter);
app.use("/dashboard", dashboardRouter);

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({
    error: error.message
  });
});

app.listen(port, () => {
  console.log(`Bangladesh24 API listening on http://localhost:${port}`);
});
