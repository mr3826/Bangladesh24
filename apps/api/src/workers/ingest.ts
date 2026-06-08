import "../utils/env.js";
import { disconnectDatabase } from "../db/client.js";
import { ingestAllSources } from "../services/ingestionService.js";

try {
  const result = await ingestAllSources();
  console.log(JSON.stringify(result, null, 2));
} finally {
  await disconnectDatabase();
}
