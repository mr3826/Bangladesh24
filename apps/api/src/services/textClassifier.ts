import { StoryCategory } from "@prisma/client";
import { DISTRICTS, DIVISIONS } from "@bangladesh24/shared";

interface LocationMatch {
  district: string | null;
  division: string | null;
}

const CATEGORY_KEYWORDS: Array<{ category: StoryCategory; terms: string[] }> = [
  {
    category: StoryCategory.DISASTER,
    terms: ["cyclone", "flood", "landslide", "earthquake", "fire", "river erosion", "embankment"]
  },
  {
    category: StoryCategory.WEATHER,
    terms: ["weather", "rain", "heatwave", "cold wave", "storm", "warning", "forecast", "bmd"]
  },
  {
    category: StoryCategory.ACCIDENT,
    terms: ["accident", "crash", "collision", "derail", "capsize", "killed", "injured", "road"]
  },
  {
    category: StoryCategory.ECONOMY,
    terms: ["price", "inflation", "remittance", "dollar", "export", "import", "market", "fuel", "stock"]
  },
  {
    category: StoryCategory.PUBLIC_NOTICE,
    terms: ["notice", "closure", "public", "advisory", "alert", "schedule", "deadline"]
  },
  {
    category: StoryCategory.POLITICS,
    terms: ["election", "party", "parliament", "minister", "politics", "government", "cabinet"]
  },
  {
    category: StoryCategory.SPORTS,
    terms: ["cricket", "football", "match", "series", "tournament", "bcb", "fifa"]
  },
  {
    category: StoryCategory.ENTERTAINMENT,
    terms: ["film", "actor", "actress", "music", "drama", "ott", "cinema"]
  },
  {
    category: StoryCategory.INTERNATIONAL,
    terms: ["india", "myanmar", "china", "usa", "united states", "un", "global", "world"]
  },
  {
    category: StoryCategory.NATIONAL,
    terms: ["bangladesh", "national", "dhaka", "country", "nationwide"]
  }
];

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyCategory(text: string): StoryCategory {
  const normalizedText = normalizeText(text);

  for (const categoryConfig of CATEGORY_KEYWORDS) {
    if (categoryConfig.terms.some((term) => normalizedText.includes(term))) {
      return categoryConfig.category;
    }
  }

  return StoryCategory.GENERAL;
}

export function detectLocation(text: string): LocationMatch {
  const normalizedText = normalizeText(text);

  for (const district of DISTRICTS) {
    if (district.aliases.some((alias) => normalizedText.includes(alias))) {
      return {
        district: district.name,
        division: district.division
      };
    }
  }

  for (const division of DIVISIONS) {
    if (division.aliases.some((alias) => normalizedText.includes(alias))) {
      return {
        district: null,
        division: division.name
      };
    }
  }

  return {
    district: null,
    division: null
  };
}
