export type ExploreSort =
  | 'rating_desc'
  | 'rating_asc'
  | 'price_asc'
  | 'price_desc';

// প্রতিটা ranking dimension-এর জন্য সমার্থক শব্দ/phrase —
// শুধু এই ৪টা dimension-ই আছে, বাকি সবকিছু এই ৪টার একটাতেই ম্যাপ হবে
export const SORT_KEYWORDS: Record<ExploreSort, string[]> = {
  rating_desc: [
    'best',
    'top',
    'highest rated',
    'top rated',
    'highest rating',
    'good',
    'great',
    'excellent',
    'highly rated',
    'popular',
  ],
  rating_asc: [
    'worst',
    'lowest rated',
    'low rated',
    'lowest rating',
    'bad',
    'poor',
    'terrible',
    'poorly rated',
    'least rated',
  ],
  price_asc: [
    'cheapest',
    'lowest price',
    'least expensive',
    'low price',
    'budget-friendly',
    'budget',
    'affordable',
    'inexpensive',
    'cheap',
    'economical',
    'lowest cost',
    'best price',
    'price low',
  ],
  price_desc: [
    'most expensive',
    'highest price',
    'high price',
    'costly',
    'expensive',
    'premium',
    'luxury',
    'upscale',
    'high-end',
    'top-end',
    'highest cost',
    'price high',
  ],
};

export type ParsedExploreQuery = {
  sort: ExploreSort;
  offeringType: string;
  locationText: string | null;
};

export function escapeRegex(str: string) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function parseExploreQuery(
  raw: string,
): ParsedExploreQuery {
  let text = ` ${raw.toLowerCase().trim()} `;

  // সব sort phrase একসাথে করে, দৈর্ঘ্য অনুযায়ী বড় থেকে ছোট সাজানো হচ্ছে —
  // যাতে "highest rated" আগে ধরা পড়ে, তার ছোট অংশ "rated" ভুল করে অন্য
  // কিছুর সাথে মিলে না যায়
  const allPhrases: {
    phrase: string;
    sort: ExploreSort;
  }[] = [];

  (Object.keys(SORT_KEYWORDS) as ExploreSort[]).forEach(
    (key) => {
      SORT_KEYWORDS[key].forEach((phrase) =>
        allPhrases.push({ phrase, sort: key }),
      );
    },
  );

  allPhrases.sort(
    (a, b) => b.phrase.length - a.phrase.length,
  );

  let sort: ExploreSort = 'rating_desc';

  for (const { phrase, sort: matchedSort } of allPhrases) {
    const re = new RegExp(
      `\\b${escapeRegex(phrase)}\\b`,
      'i',
    );

    if (re.test(text)) {
      sort = matchedSort;
      text = text.replace(re, ' ');
      break;
    }
  }

  // শেষে "in <location>" প্যাটার্ন থেকে location বের করা
  let locationText: string | null = null;
  const locationMatch = text.match(
    /\bin\s+([a-z0-9 .'-]+?)\s*$/i,
  );

  if (locationMatch) {
    locationText = locationMatch[1].trim();
    text = text.slice(0, locationMatch.index).trim();
  }

  const offeringType = text.replace(/\s+/g, ' ').trim();

  return { sort, offeringType, locationText };
}
