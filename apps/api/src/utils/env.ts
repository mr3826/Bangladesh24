import dotenv from "dotenv";
import { workspacePath } from "./workspace.js";

dotenv.config({
  path: workspacePath(".env")
});
