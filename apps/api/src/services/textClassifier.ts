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

interface StoryQualityMatch {
  isUseful: boolean;
  reason: string;
}

const BANGLA_LOCATION_ALIASES: Array<{ alias: string; district: string | null; division: string }> = [
  { alias: "বাগেরহাট", district: "Bagerhat", division: "Khulna" },
  { alias: "বান্দরবান", district: "Bandarban", division: "Chattogram" },
  { alias: "বরগুনা", district: "Barguna", division: "Barishal" },
  { alias: "বরিশাল", district: "Barishal", division: "Barishal" },
  { alias: "ভোলা", district: "Bhola", division: "Barishal" },
  { alias: "বগুড়া", district: "Bogura", division: "Rajshahi" },
  { alias: "বগুড়া", district: "Bogura", division: "Rajshahi" },
  { alias: "ব্রাহ্মণবাড়িয়া", district: "Brahmanbaria", division: "Chattogram" },
  { alias: "ব্রাহ্মণবাড়িয়া", district: "Brahmanbaria", division: "Chattogram" },
  { alias: "চাঁদপুর", district: "Chandpur", division: "Chattogram" },
  { alias: "চাঁপাইনবাবগঞ্জ", district: "Chapai Nawabganj", division: "Rajshahi" },
  { alias: "নবাবগঞ্জ", district: "Chapai Nawabganj", division: "Rajshahi" },
  { alias: "চট্টগ্রাম", district: "Chattogram", division: "Chattogram" },
  { alias: "চট্রগ্রাম", district: "Chattogram", division: "Chattogram" },
  { alias: "চুয়াডাঙ্গা", district: "Chuadanga", division: "Khulna" },
  { alias: "চুয়াডাঙ্গা", district: "Chuadanga", division: "Khulna" },
  { alias: "কক্সবাজার", district: "Cox's Bazar", division: "Chattogram" },
  { alias: "কক্স'স বাজার", district: "Cox's Bazar", division: "Chattogram" },
  { alias: "কুমিল্লা", district: "Cumilla", division: "Chattogram" },
  { alias: "ঢাকা", district: "Dhaka", division: "Dhaka" },
  { alias: "দিনাজপুর", district: "Dinajpur", division: "Rangpur" },
  { alias: "ফরিদপুর", district: "Faridpur", division: "Dhaka" },
  { alias: "ফেনী", district: "Feni", division: "Chattogram" },
  { alias: "গাইবান্ধা", district: "Gaibandha", division: "Rangpur" },
  { alias: "গাজীপুর", district: "Gazipur", division: "Dhaka" },
  { alias: "গোপালগঞ্জ", district: "Gopalganj", division: "Dhaka" },
  { alias: "হবিগঞ্জ", district: "Habiganj", division: "Sylhet" },
  { alias: "জামালপুর", district: "Jamalpur", division: "Mymensingh" },
  { alias: "যশোর", district: "Jashore", division: "Khulna" },
  { alias: "ঝালকাঠি", district: "Jhalokathi", division: "Barishal" },
  { alias: "ঝিনাইদহ", district: "Jhenaidah", division: "Khulna" },
  { alias: "জয়পুরহাট", district: "Joypurhat", division: "Rajshahi" },
  { alias: "জয়পুরহাট", district: "Joypurhat", division: "Rajshahi" },
  { alias: "খাগড়াছড়ি", district: "Khagrachhari", division: "Chattogram" },
  { alias: "খাগড়াছড়ি", district: "Khagrachhari", division: "Chattogram" },
  { alias: "খুলনা", district: "Khulna", division: "Khulna" },
  { alias: "কিশোরগঞ্জ", district: "Kishoreganj", division: "Dhaka" },
  { alias: "কুড়িগ্রাম", district: "Kurigram", division: "Rangpur" },
  { alias: "কুড়িগ্রাম", district: "Kurigram", division: "Rangpur" },
  { alias: "কুষ্টিয়া", district: "Kushtia", division: "Khulna" },
  { alias: "কুষ্টিয়া", district: "Kushtia", division: "Khulna" },
  { alias: "লক্ষ্মীপুর", district: "Lakshmipur", division: "Chattogram" },
  { alias: "লালমনিরহাট", district: "Lalmonirhat", division: "Rangpur" },
  { alias: "মাদারীপুর", district: "Madaripur", division: "Dhaka" },
  { alias: "মাগুরা", district: "Magura", division: "Khulna" },
  { alias: "মানিকগঞ্জ", district: "Manikganj", division: "Dhaka" },
  { alias: "মেহেরপুর", district: "Meherpur", division: "Khulna" },
  { alias: "মৌলভীবাজার", district: "Moulvibazar", division: "Sylhet" },
  { alias: "মুন্সিগঞ্জ", district: "Munshiganj", division: "Dhaka" },
  { alias: "ময়মনসিংহ", district: "Mymensingh", division: "Mymensingh" },
  { alias: "ময়মনসিংহ", district: "Mymensingh", division: "Mymensingh" },
  { alias: "নওগাঁ", district: "Naogaon", division: "Rajshahi" },
  { alias: "নড়াইল", district: "Narail", division: "Khulna" },
  { alias: "নড়াইল", district: "Narail", division: "Khulna" },
  { alias: "নারায়ণগঞ্জ", district: "Narayanganj", division: "Dhaka" },
  { alias: "নারায়ণগঞ্জ", district: "Narayanganj", division: "Dhaka" },
  { alias: "নরসিংদী", district: "Narsingdi", division: "Dhaka" },
  { alias: "নাটোর", district: "Natore", division: "Rajshahi" },
  { alias: "নেত্রকোনা", district: "Netrokona", division: "Mymensingh" },
  { alias: "নেত্রকোণা", district: "Netrokona", division: "Mymensingh" },
  { alias: "নীলফামারী", district: "Nilphamari", division: "Rangpur" },
  { alias: "নোয়াখালী", district: "Noakhali", division: "Chattogram" },
  { alias: "নোয়াখালী", district: "Noakhali", division: "Chattogram" },
  { alias: "পাবনা", district: "Pabna", division: "Rajshahi" },
  { alias: "পঞ্চগড়", district: "Panchagarh", division: "Rangpur" },
  { alias: "পঞ্চগড়", district: "Panchagarh", division: "Rangpur" },
  { alias: "পটুয়াখালী", district: "Patuakhali", division: "Barishal" },
  { alias: "পটুয়াখালী", district: "Patuakhali", division: "Barishal" },
  { alias: "পিরোজপুর", district: "Pirojpur", division: "Barishal" },
  { alias: "রাজবাড়ী", district: "Rajbari", division: "Dhaka" },
  { alias: "রাজবাড়ী", district: "Rajbari", division: "Dhaka" },
  { alias: "রাজশাহী", district: "Rajshahi", division: "Rajshahi" },
  { alias: "রাঙ্গামাটি", district: "Rangamati", division: "Chattogram" },
  { alias: "রংপুর", district: "Rangpur", division: "Rangpur" },
  { alias: "সাতক্ষীরা", district: "Satkhira", division: "Khulna" },
  { alias: "শরীয়তপুর", district: "Shariatpur", division: "Dhaka" },
  { alias: "শরীয়তপুর", district: "Shariatpur", division: "Dhaka" },
  { alias: "শেরপুর", district: "Sherpur", division: "Mymensingh" },
  { alias: "সিরাজগঞ্জ", district: "Sirajganj", division: "Rajshahi" },
  { alias: "সুনামগঞ্জ", district: "Sunamganj", division: "Sylhet" },
  { alias: "সিলেট", district: "Sylhet", division: "Sylhet" },
  { alias: "টাঙ্গাইল", district: "Tangail", division: "Dhaka" },
  { alias: "ঠাকুরগাঁও", district: "Thakurgaon", division: "Rangpur" },
  { alias: "বরিশাল বিভাগ", district: null, division: "Barishal" },
  { alias: "চট্টগ্রাম বিভাগ", district: null, division: "Chattogram" },
  { alias: "ঢাকা বিভাগ", district: null, division: "Dhaka" },
  { alias: "খুলনা বিভাগ", district: null, division: "Khulna" },
  { alias: "ময়মনসিংহ বিভাগ", district: null, division: "Mymensingh" },
  { alias: "ময়মনসিংহ বিভাগ", district: null, division: "Mymensingh" },
  { alias: "রাজশাহী বিভাগ", district: null, division: "Rajshahi" },
  { alias: "রংপুর বিভাগ", district: null, division: "Rangpur" },
  { alias: "সিলেট বিভাগ", district: null, division: "Sylhet" }
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

const LOW_VALUE_URL_MARKERS = [
  "/entertainment",
  "/lifestyle",
  "/opinion",
  "/editorial",
  "/column",
  "/columns",
  "/photo",
  "/photos",
  "/gallery",
  "/video",
  "/recipe",
  "/horoscope",
  "/feature",
  "/fashion"
];

const LOW_VALUE_TERMS = [
  "opinion",
  "editorial",
  "column",
  "photo gallery",
  "photos",
  "watch video",
  "entertainment",
  "celebrity",
  "actor",
  "actress",
  "film",
  "music",
  "drama",
  "ott",
  "lifestyle",
  "recipe",
  "horoscope",
  "মতামত",
  "সম্পাদকীয়",
  "সম্পাদকীয়",
  "কলাম",
  "ছবি",
  "ফটো",
  "ভিডিও",
  "বিনোদন",
  "তারকা",
  "অভিনেতা",
  "অভিনেত্রী",
  "নাটক",
  "সিনেমা",
  "ওটিটি",
  "লাইফস্টাইল",
  "রেসিপি",
  "রাশিফল",
  "ফিচার"
];

const HIGH_VALUE_PUBLIC_INTEREST_TERMS = [
  "alert",
  "warning",
  "dead",
  "death",
  "killed",
  "injured",
  "missing",
  "arrest",
  "court",
  "police",
  "rab",
  "bgb",
  "fire",
  "flood",
  "cyclone",
  "storm",
  "landslide",
  "river erosion",
  "accident",
  "crash",
  "collision",
  "derail",
  "capsize",
  "strike",
  "shutdown",
  "price",
  "inflation",
  "fuel",
  "market",
  "export",
  "remittance",
  "election",
  "government",
  "cabinet",
  "parliament",
  "advisory",
  "closure",
  "deadline",
  "সতর্কতা",
  "নিহত",
  "মৃত্যু",
  "আহত",
  "নিখোঁজ",
  "গ্রেপ্তার",
  "আদালত",
  "পুলিশ",
  "র‍্যাব",
  "র‌্যাব",
  "বিজিবি",
  "আগুন",
  "অগ্নিকাণ্ড",
  "বন্যা",
  "ঘূর্ণিঝড়",
  "ঘূর্ণিঝড়",
  "ঝড়",
  "ঝড়",
  "ভূমিধস",
  "নদীভাঙন",
  "দুর্ঘটনা",
  "সংঘর্ষ",
  "লাইনচ্যুত",
  "ডুবি",
  "ধর্মঘট",
  "অবরোধ",
  "দাম",
  "মূল্য",
  "বাজার",
  "জ্বালানি",
  "রপ্তানি",
  "রেমিট্যান্স",
  "নির্বাচন",
  "সরকার",
  "মন্ত্রিসভা",
  "সংসদ",
  "পরামর্শ",
  "বন্ধ",
  "সময়সীমা",
  "সময়সীমা"
];

const CATEGORY_KEYWORDS: Array<{ category: StoryCategory; terms: string[] }> = [
  {
    category: StoryCategory.DISASTER,
    terms: [
      "cyclone",
      "flood",
      "landslide",
      "earthquake",
      "fire",
      "river erosion",
      "embankment",
      "ঘূর্ণিঝড়",
      "ঘূর্ণিঝড়",
      "বন্যা",
      "ভূমিধস",
      "ভূমিকম্প",
      "আগুন",
      "অগ্নিকাণ্ড",
      "নদীভাঙন",
      "বাঁধ"
    ]
  },
  {
    category: StoryCategory.WEATHER,
    terms: [
      "weather",
      "rain",
      "heatwave",
      "cold wave",
      "storm",
      "warning",
      "forecast",
      "bmd",
      "আবহাওয়া",
      "আবহাওয়া",
      "বৃষ্টি",
      "তাপপ্রবাহ",
      "শৈত্যপ্রবাহ",
      "ঝড়",
      "ঝড়",
      "সতর্কতা",
      "পূর্বাভাস"
    ]
  },
  {
    category: StoryCategory.ACCIDENT,
    terms: [
      "accident",
      "crash",
      "collision",
      "derail",
      "capsize",
      "killed",
      "injured",
      "road",
      "দুর্ঘটনা",
      "সংঘর্ষ",
      "লাইনচ্যুত",
      "ডুবি",
      "সড়ক",
      "সড়ক",
      "নিহত",
      "আহত"
    ]
  },
  {
    category: StoryCategory.ECONOMY,
    terms: [
      "price",
      "inflation",
      "remittance",
      "dollar",
      "export",
      "import",
      "market",
      "fuel",
      "stock",
      "দাম",
      "মূল্য",
      "মূল্যস্ফীতি",
      "রেমিট্যান্স",
      "ডলার",
      "রপ্তানি",
      "আমদানি",
      "বাজার",
      "জ্বালানি",
      "শেয়ার",
      "শেয়ার"
    ]
  },
  {
    category: StoryCategory.PUBLIC_NOTICE,
    terms: [
      "notice",
      "closure",
      "public",
      "advisory",
      "alert",
      "schedule",
      "deadline",
      "বিজ্ঞপ্তি",
      "পরামর্শ",
      "সতর্কতা",
      "সূচি",
      "সময়সীমা",
      "সময়সীমা",
      "বন্ধ"
    ]
  },
  {
    category: StoryCategory.POLITICS,
    terms: [
      "election",
      "party",
      "parliament",
      "minister",
      "politics",
      "government",
      "cabinet",
      "নির্বাচন",
      "দল",
      "সংসদ",
      "মন্ত্রী",
      "রাজনীতি",
      "সরকার",
      "মন্ত্রিসভা"
    ]
  },
  {
    category: StoryCategory.SPORTS,
    terms: ["cricket", "football", "match", "series", "tournament", "bcb", "fifa", "ক্রিকেট", "ফুটবল", "ম্যাচ", "সিরিজ", "টুর্নামেন্ট"]
  },
  {
    category: StoryCategory.ENTERTAINMENT,
    terms: ["film", "actor", "actress", "music", "drama", "ott", "cinema", "সিনেমা", "অভিনেতা", "অভিনেত্রী", "সংগীত", "নাটক", "ওটিটি"]
  },
  {
    category: StoryCategory.INTERNATIONAL,
    terms: ["india", "myanmar", "china", "usa", "united states", "un", "global", "world", "ভারত", "মিয়ানমার", "মিয়ানমার", "চীন", "যুক্তরাষ্ট্র", "জাতিসংঘ", "বিশ্ব"]
  },
  {
    category: StoryCategory.NATIONAL,
    terms: ["bangladesh", "national", "dhaka", "country", "nationwide", "বাংলাদেশ", "জাতীয়", "জাতীয়", "ঢাকা", "দেশে", "সারা দেশে"]
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

interface LocationCandidate extends LocationMatch {
  aliasLength: number;
  index: number;
  score: number;
}

const LOCATION_CONTEXT_TERMS = [
  "জেলায়",
  "জেলার",
  "জেলা",
  "উপজেলায়",
  "উপজেলার",
  "থানায়",
  "থানার",
  "সদরে",
  "শহরে",
  "অংশে",
  "এলাকায়",
  "এলাকার",
  "পৌরসভায়",
  "ইউনিয়নে",
  "ইউনিয়নে",
  "upazila",
  "district",
  "city"
];

function isDivisionNamedDistrict(district: string | null) {
  return Boolean(district && DIVISIONS.some((division) => division.name === district));
}

function hasLocationContext(normalizedText: string, index: number, aliasLength: number) {
  const trailingText = normalizedText.slice(index + aliasLength, index + aliasLength + 32);
  return LOCATION_CONTEXT_TERMS.some((term) => trailingText.includes(term));
}

function createLocationCandidate(
  normalizedText: string,
  alias: string,
  district: string | null,
  division: string
): LocationCandidate | null {
  const normalizedAlias = normalizeText(alias);
  const index = normalizedText.indexOf(normalizedAlias);

  if (index === -1) {
    return null;
  }

  const hasContext = hasLocationContext(normalizedText, index, normalizedAlias.length);

  if (index > 1200 && !hasContext) {
    return null;
  }

  let score = index;

  if (hasContext) {
    score -= 1000;
  }

  if (district) {
    score -= 160;
  } else {
    score += 240;
  }

  if (index <= 180) {
    score -= 180;
  }

  if (isDivisionNamedDistrict(district)) {
    score += 45;
  }

  return {
    district,
    division,
    index,
    aliasLength: normalizedAlias.length,
    score
  };
}

export function detectLocation(text: string): LocationMatch {
  const normalizedText = normalizeText(text);
  const candidates: LocationCandidate[] = [];

  for (const locationAlias of BANGLA_LOCATION_ALIASES) {
    const candidate = createLocationCandidate(
      normalizedText,
      locationAlias.alias,
      locationAlias.district,
      locationAlias.division
    );

    if (candidate) {
      candidates.push(candidate);
    }
  }

  for (const district of DISTRICTS) {
    for (const alias of district.aliases) {
      const candidate = createLocationCandidate(normalizedText, alias, district.name, district.division);

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  for (const division of DIVISIONS) {
    for (const alias of division.aliases) {
      const candidate = createLocationCandidate(normalizedText, alias, null, division.name);

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  const bestCandidate = candidates.sort(
    (first, second) => first.score - second.score || second.aliasLength - first.aliasLength
  )[0];

  if (bestCandidate) {
    return {
      district: bestCandidate.district,
      division: bestCandidate.division
    };
  }

  return {
    district: null,
    division: null
  };
}

function includesAny(normalizedText: string, terms: string[]) {
  return terms.some((term) => normalizedText.includes(term));
}

export function analyzeStoryQuality(text: string, category?: StoryCategory): StoryQualityMatch {
  const normalizedText = normalizeText(text);
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
  const hasLowValueUrl = includesAny(normalizedText, LOW_VALUE_URL_MARKERS);
  const hasLowValueTerm = includesAny(normalizedText, LOW_VALUE_TERMS);
  const hasHighValueTerm = includesAny(normalizedText, HIGH_VALUE_PUBLIC_INTEREST_TERMS);

  if (wordCount < 5) {
    return {
      isUseful: false,
      reason: "Story text is too short to verify as a useful news item."
    };
  }

  if (category === StoryCategory.ENTERTAINMENT && !hasHighValueTerm) {
    return {
      isUseful: false,
      reason: "Entertainment item without a public-interest signal."
    };
  }

  if ((hasLowValueUrl || hasLowValueTerm) && !hasHighValueTerm) {
    return {
      isUseful: false,
      reason: "Matched low-value editorial, gallery, lifestyle, or soft-news signals."
    };
  }

  return {
    isUseful: true,
    reason: "Story passed public-interest quality filters."
  };
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

  if ((hasForeignUrl || hasForeignTerm) && !hasLocation) {
    return {
      isBangladeshLocal: false,
      reason: "Matched foreign or global section/terms without a Bangladesh district or division."
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
