import Parser from "rss-parser";
import type { Source } from "@prisma/client";
import type { IngestionRunResult, SourceIngestionResult } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { seedSourcesFromConfig } from "./sourceService.js";
import {
  analyzeBangladeshLocality,
  analyzeStoryQuality,
  classifyCategory,
  detectLocation
} from "./textClassifier.js";

const parser = new Parser();
const FEED_TIMEOUT_MS = 12000;
const REQUEST_HEADERS = {
  "User-Agent": "Bangladesh24MVP/0.1 (+local development)",
  Accept: "application/rss+xml, application/xml, text/xml, */*"
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function limitText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function parsePublishedDate(value: unknown) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeLink(value: unknown) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function ingestSource(source: Source): Promise<SourceIngestionResult> {
  const result: SourceIngestionResult = {
    sourceSlug: source.slug,
    sourceName: source.name,
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: false
  };

  try {
    const feedXml = await fetchFeedXml(source.feedUrl);
    const feed = await parser.parseString(feedXml);
    const items = feed.items.slice(0, 40);
    result.fetched = items.length;

    for (const item of items) {
      const title = stripHtml(item.title ?? "");
      const link = normalizeLink(item.link ?? item.guid);

      if (!title || !link) {
        continue;
      }

      const rawSummary = item.contentSnippet ?? item.summary ?? item.content ?? "";
      const summary = rawSummary ? limitText(stripHtml(rawSummary), 450) : null;
      const content = item.content ? limitText(stripHtml(item.content), 2000) : summary;
      const combinedText = [title, summary, content, link].filter(Boolean).join(" ");
      const location = detectLocation(combinedText);
      const locality = analyzeBangladeshLocality(combinedText);
      const category = classifyCategory(combinedText);
      const quality = analyzeStoryQuality(combinedText, category);
      const publishedAt = parsePublishedDate(item.isoDate ?? item.pubDate);
      const existingStory = await prisma.story.findUnique({ where: { link } });

      if (!locality.isBangladeshLocal) {
        result.skipped += 1;

        if (existingStory) {
          await prisma.story.update({
            where: { id: existingStory.id },
            data: {
              isBangladeshLocal: false,
              status: "ARCHIVED",
              renderStatus: "skipped_non_bd"
            }
          });
          await prisma.postingQueue.updateMany({
            where: { storyId: existingStory.id },
            data: { status: "SKIPPED" }
          });
        }

        continue;
      }

      if (!quality.isUseful) {
        result.skipped += 1;

        if (existingStory) {
          await prisma.story.update({
            where: { id: existingStory.id },
            data: {
              isBangladeshLocal: true,
              status: "ARCHIVED",
              renderStatus: "skipped_quality"
            }
          });
          await prisma.postingQueue.updateMany({
            where: { storyId: existingStory.id },
            data: { status: "SKIPPED" }
          });
        }

        continue;
      }

      await prisma.story.upsert({
        where: { link },
        update: {
          sourceId: source.id,
          externalId: item.guid ?? link,
          title,
          summary,
          content,
          publishedAt,
          district: location.district,
          division: location.division,
          isBangladeshLocal: true,
          category,
          status: existingStory?.status === "ARCHIVED" ? "NEW" : undefined,
          renderStatus: existingStory?.renderStatus?.startsWith("skipped_") ? null : existingStory?.renderStatus
        },
        create: {
          sourceId: source.id,
          externalId: item.guid ?? link,
          title,
          summary,
          content,
          link,
          publishedAt,
          district: location.district,
          division: location.division,
          isBangladeshLocal: true,
          category
        }
      });

      if (existingStory) {
        result.updated += 1;
      } else {
        result.created += 1;
      }
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date() }
    });
  } catch (error) {
    result.failed = true;
    result.error = error instanceof Error ? error.message : "Unknown ingestion error";
  }

  return result;
}

async function fetchFeedXml(feedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetch(feedUrl, {
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Feed responded with ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function ingestAllSources(): Promise<IngestionRunResult> {
  const startedAt = new Date();
  await seedSourcesFromConfig();

  const activeSources = await prisma.source.findMany({
    where: { active: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }]
  });

  const results: SourceIngestionResult[] = [];

  for (const source of activeSources) {
    results.push(await ingestSource(source));
  }

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    totalFetched: results.reduce((sum, result) => sum + result.fetched, 0),
    totalCreated: results.reduce((sum, result) => sum + result.created, 0),
    totalUpdated: results.reduce((sum, result) => sum + result.updated, 0),
    totalSkipped: results.reduce((sum, result) => sum + result.skipped, 0),
    results
  };
}
