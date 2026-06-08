import Database from "better-sqlite3";
import path from "node:path";

function sqlitePathFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Only SQLite file URLs are supported for the MVP: ${databaseUrl}`);
  }

  const filePath = databaseUrl.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const databasePath = sqlitePathFromUrl(databaseUrl);
const database = new Database(databasePath);

database.pragma("foreign_keys = ON");

database.exec(`
CREATE TABLE IF NOT EXISTS "Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "homepageUrl" TEXT NOT NULL,
  "feedUrl" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'en',
  "priority" INTEGER NOT NULL DEFAULT 5,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "lastFetchedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Story" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "externalId" TEXT,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT,
  "link" TEXT NOT NULL UNIQUE,
  "publishedAt" DATETIME,
  "ingestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "district" TEXT,
  "division" TEXT,
  "isBangladeshLocal" BOOLEAN NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "importanceScore" REAL NOT NULL DEFAULT 0,
  "scoreBreakdown" JSONB,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "scriptBangla" TEXT,
  "captionBangla" TEXT,
  "hashtags" TEXT,
  "subtitleSrtPath" TEXT,
  "subtitleVttPath" TEXT,
  "audioPath" TEXT,
  "videoPath" TEXT,
  "renderStatus" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Story_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostingQueue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storyId" TEXT NOT NULL UNIQUE,
  "platform" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'READY',
  "scheduledFor" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostingQueue_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Story_publishedAt_idx" ON "Story"("publishedAt");
CREATE INDEX IF NOT EXISTS "Story_importanceScore_idx" ON "Story"("importanceScore");
CREATE INDEX IF NOT EXISTS "Story_status_idx" ON "Story"("status");
CREATE INDEX IF NOT EXISTS "Story_district_idx" ON "Story"("district");
CREATE INDEX IF NOT EXISTS "Story_division_idx" ON "Story"("division");
CREATE INDEX IF NOT EXISTS "PostingQueue_status_idx" ON "PostingQueue"("status");
CREATE INDEX IF NOT EXISTS "PostingQueue_scheduledFor_idx" ON "PostingQueue"("scheduledFor");
`);

const existingStoryColumns = new Set(
  database.prepare(`PRAGMA table_info("Story")`).all().map((column) => (column as { name: string }).name)
);
const storyColumnsToAdd = [
  ["subtitleSrtPath", "TEXT"],
  ["subtitleVttPath", "TEXT"],
  ["audioPath", "TEXT"],
  ["videoPath", "TEXT"],
  ["renderStatus", "TEXT"],
  ["isBangladeshLocal", "BOOLEAN NOT NULL DEFAULT 0"]
] as const;

for (const [columnName, columnType] of storyColumnsToAdd) {
  if (!existingStoryColumns.has(columnName)) {
    database.exec(`ALTER TABLE "Story" ADD COLUMN "${columnName}" ${columnType}`);
  }
}

database.exec(`CREATE INDEX IF NOT EXISTS "Story_isBangladeshLocal_idx" ON "Story"("isBangladeshLocal")`);

database.close();

console.log(`SQLite database ready at ${databasePath}`);
