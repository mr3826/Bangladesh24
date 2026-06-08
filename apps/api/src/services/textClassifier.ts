import { StoryCategory } from "@prisma/client";
import { DISTRICTS, DIVISIONS } from "@bangladesh24/shared";

interface LocationMatch {
  district: string | null;
  division: string | null;
}

interface BangladeshLocalityMatch {
  isBangladeshLocal: boolean;
  reason: string;
}

const BANGLA_LOCATION_ALIASES: Array<{ alias: string; district: string | null; division: string }> = [
  { alias: "ঢাকা", district: "Dhaka", division: "Dhaka" },
  { alias: "চট্টগ্রাম", district: "Chattogram", division: "Chattogram" },
  { alias: "চট্রগ্রাম", district: "Chattogram", division: "Chattogram" },
  { alias: "কক্সবাজার", district: "Cox's Bazar", division: "Chattogram" },
  { alias: "কক্সবাজার", district: "Cox's Bazar", division: "Chattogram" },
  { alias: "সিলেট", district: "Sylhet", division: "Sylhet" },
  { alias: "রাজশাহী", district: "Rajshahi", division: "Rajshahi" },
  { alias: "খুলনা", district: "Khulna", division: "Khulna" },
  { alias: "বরিশাল", district: "Barishal", division: "Barishal" },
  { alias: "বরিশাল", district: "Barishal", division: "Barishal" },
  { alias: "রংপুর", district: "Rangpur", division: "Rangpur" },
  { alias: "ময়মনসিংহ", district: "Mymensingh", division: "Mymensingh" },
  { alias: "ময়মনসিংহ", district: "Mymensingh", division: "Mymensingh" },
  { alias: "কুমিল্লা", district: "Cumilla", division: "Chattogram" },
  { alias: "নোয়াখালী", district: "Noakhali", division: "Chattogram" },
  { alias: "নোয়াখালী", district: "Noakhali", division: "Chattogram" },
  { alias: "ফেনী", district: "Feni", division: "Chattogram" },
  { alias: "চাঁদপুর", district: "Chandpur", division: "Chattogram" },
  { alias: "গাজীপুর", district: "Gazipur", division: "Dhaka" },
  { alias: "নারায়ণগঞ্জ", district: "Narayanganj", division: "Dhaka" },
  { alias: "নারায়ণগঞ্জ", district: "Narayanganj", division: "Dhaka" },
  { alias: "ফরিদপুর", district: "Faridpur", division: "Dhaka" },
  { alias: "টাঙ্গাইল", district: "Tangail", division: "Dhaka" },
  { alias: "যশোর", district: "Jashore", division: "Khulna" },
  { alias: "কুষ্টিয়া", district: "Kushtia", division: "Khulna" },
  { alias: "কুষ্টিয়া", district: "Kushtia", division: "Khulna" },
  { alias: "বগুড়া", district: "Bogura", division: "Rajshahi" },
  { alias: "বগুড়া", district: "Bogura", division: "Rajshahi" },
  { alias: "দিনাজপুর", district: "Dinajpur", division: "Rangpur" },
  { alias: "জামালপুর", district: "Jamalpur", division: "Mymensingh" },
  { alias: "সুনামগঞ্জ", district: "Sunamganj", division: "Sylhet" }
];

const LOCAL_URL_MARKERS = [
  "/bangladesh",
  "/national",
  "/country",
  "/city",
  "/dhaka",
  "/weather",
  "/economy",
  "/business",
  "/local",
  "/district",
  "/bangla"
];

const FOREIGN_URL_MARKERS = [
  "/world",
  "/international",
  "/hollywood",
  "/bollywood",
  "/entertainment/hollywood",
  "/sports/world"
];

const STRONG_BD_LOCAL_TERMS = [
  "in bangladesh",
  "inside bangladesh",
  "across bangladesh",
  "nationwide",
  "dhaka",
  "chattogram",
  "chittagong",
  "sylhet",
  "rajshahi",
  "khulna",
  "barishal",
  "barisal",
  "rangpur",
  "mymensingh",
  "cox's bazar",
  "cox bazar",
  "bmd",
  "bgb",
  "rab",
  "dmp",
  "dse",
  "bsec",
  "ec bangladesh",
  "বাংলাদেশে",
  "দেশে",
  "সারা দেশে",
  "রাজধানী",
  "জেলা",
  "উপজেলা",
  "থানা",
  "ইউনিয়ন",
  "ইউনিয়ন",
  "পৌরসভা",
  "সচিবালয়",
  "সচিবালয়",
  "সংসদ",
  "প্রধান উপদেষ্টা",
  "আবহাওয়া",
  "আবহাওয়া",
  "ডিএমপি",
  "র‍্যাব",
  "র‌্যাব",
  "বিজিবি",
  "পদ্মা",
  "মেঘনা",
  "যমুনা"
];

const WEAK_BD_TERMS = ["bangladesh", "bd", "বাংলাদেশ", "জাতীয়", "জাতীয়"];

const FOREIGN_ONLY_TERMS = [
  "world",
  "global",
  "international",
  "hollywood",
  "bollywood",
  "india",
  "pakistan",
  "myanmar",
  "usa",
  "united states",
  "china",
  "russia",
  "ukraine",
  "iran",
  "israel",
  "gaza",
  "palestine",
  "trump",
  "europe",
  "বিশ্ব",
  "বিশ্বজুড়ে",
  "বিশ্বজুড়ে",
  "বৈশ্বিক",
  "আন্তর্জাতিক",
  "হলিউড",
  "বলিউড",
  "ভারত",
  "পাকিস্তান",
  "মিয়ানমার",
  "মিয়ানমার",
  "যুক্তরাষ্ট্র",
  "আমেরিকা",
  "চীন",
  "রাশিয়া",
  "রাশিয়া",
  "ইউক্রেন",
  "ইরান",
  "ইসরায়েল",
  "ইসরায়েল",
  "গাজা",
  "ফিলিস্তিন",
  "ট্রাম্প",
  "ইউরোপ"
];

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

  for (const locationAlias of BANGLA_LOCATION_ALIASES) {
    if (normalizedText.includes(locationAlias.alias)) {
      return {
        district: locationAlias.district,
        division: locationAlias.division
      };
    }
  }

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

function includesAny(normalizedText: string, terms: string[]) {
  return terms.some((term) => normalizedText.includes(term));
}

export function analyzeBangladeshLocality(text: string): BangladeshLocalityMatch {
  const normalizedText = normalizeText(text);
  const location = detectLocation(text);
  const hasLocation = Boolean(location.district || location.division);
  const hasLocalUrl = includesAny(normalizedText, LOCAL_URL_MARKERS);
  const hasForeignUrl = includesAny(normalizedText, FOREIGN_URL_MARKERS);
  const hasStrongLocalTerm = includesAny(normalizedText, STRONG_BD_LOCAL_TERMS);
  const hasWeakBangladeshTerm = includesAny(normalizedText, WEAK_BD_TERMS);
  const hasForeignTerm = includesAny(normalizedText, FOREIGN_ONLY_TERMS);

  if (hasLocation) {
    return {
      isBangladeshLocal: true,
      reason: "Matched a Bangladesh district or division."
    };
  }

  if (hasForeignUrl && !hasStrongLocalTerm) {
    return {
      isBangladeshLocal: false,
      reason: "Matched foreign or global URL section without a Bangladesh location."
    };
  }

  if (hasStrongLocalTerm) {
    return {
      isBangladeshLocal: true,
      reason: "Matched Bangladesh-local terms."
    };
  }

  if (hasForeignTerm) {
    return {
      isBangladeshLocal: false,
      reason: "Matched foreign or global terms without a Bangladesh location."
    };
  }

  if (hasLocalUrl || hasWeakBangladeshTerm) {
    return {
      isBangladeshLocal: true,
      reason: "Matched Bangladesh source section or national marker."
    };
  }

  return {
    isBangladeshLocal: false,
    reason: "No Bangladesh location or local national marker found."
  };
}
