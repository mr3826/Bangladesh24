import { existsSync } from "node:fs";
import path from "node:path";

export function findWorkspaceRoot(startDirectory = process.cwd()) {
  let currentDirectory = path.resolve(startDirectory);

  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(path.join(currentDirectory, "PROJECT.md"))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      break;
    }

    currentDirectory = parentDirectory;
  }

  return path.resolve(startDirectory, "../..");
}

export function workspacePath(...segments: string[]) {
  return path.join(findWorkspaceRoot(), ...segments);
}
