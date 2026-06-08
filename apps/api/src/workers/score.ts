import "../utils/env.js";
import { disconnectDatabase } from "../db/client.js";
import { scoreNewStories } from "../services/scoringService.js";

try {
  const result = await scoreNewStories();
  console.log(JSON.stringify(result, null, 2));
} finally {
  await disconnectDatabase();
}
