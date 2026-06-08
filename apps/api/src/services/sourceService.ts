import { readFile } from "node:fs/promises";
import type { Source } from "@prisma/client";
import type { NewsSourceConfig, SourceSummary } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { workspacePath } from "../utils/workspace.js";

export function mapSource(source: Source): SourceSummary {
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    feedUrl: source.feedUrl,
    language: source.language === "bn" ? "bn" : "en",
    priority: source.priority,
    active: source.active,
    lastFetchedAt: source.lastFetchedAt?.toISOString() ?? null
  };
}

export async function readSourceConfig(): Promise<NewsSourceConfig[]> {
  const sourceFile = workspacePath("data", "sources.json");
  const fileContent = await readFile(sourceFile, "utf8");
  return JSON.parse(fileContent) as NewsSourceConfig[];
}

export async function seedSourcesFromConfig() {
  const sourceConfigs = await readSourceConfig();
  const configuredSlugs = sourceConfigs.map((source) => source.slug);

  const upsertedSources = await Promise.all(
    sourceConfigs.map((source) =>
      prisma.source.upsert({
        where: { slug: source.slug },
        update: {
          name: source.name,
          homepageUrl: source.homepageUrl,
          feedUrl: source.feedUrl,
          language: source.language,
          priority: source.priority,
          active: source.active
        },
        create: {
          slug: source.slug,
          name: source.name,
          homepageUrl: source.homepageUrl,
          feedUrl: source.feedUrl,
          language: source.language,
          priority: source.priority,
          active: source.active
        }
      })
    )
  );

  await prisma.source.updateMany({
    where: {
      slug: {
        notIn: configuredSlugs
      }
    },
    data: {
      active: false
    }
  });

  return upsertedSources.map(mapSource);
}

export async function listSources() {
  const sources = await prisma.source.findMany({
    orderBy: [{ active: "desc" }, { priority: "desc" }, { name: "asc" }]
  });

  return sources.map(mapSource);
}

export async function ensureSeededSources() {
  const sourceCount = await prisma.source.count();

  if (sourceCount === 0) {
    return seedSourcesFromConfig();
  }

  return listSources();
}
