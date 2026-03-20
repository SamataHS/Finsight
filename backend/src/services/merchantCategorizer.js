/**
 * Merchant-based transaction categorizer
 * Uses merchant names to automatically categorize transactions
 * Falls back to AI if merchant not found
 */

const MERCHANT_KEYWORDS = {
  "Food & Dining": [
    "swiggy",
    "zomato",
    "ubereats",
    "dominos",
    "pizza hut",
    "kfc",
    "mcdonalds",
    "burger king",
    "starbucks",
    "cafe",
    "restaurant",
    "food",
    "bakery",
    "dhaba",
    "biryani",
    "pizza",
    "hotel",
    "diner",
    "bar & grill",
  ],
  Transport: [
    "uber",
    "ola",
    "rapido",
    "lyft",
    "taxi",
    "auto",
    "petrol",
    "fuel",
    "diesel",
    "parking",
    "metro",
    "train",
    "bus",
    "airline",
    "railway",
    "airbnb",
    "hotel booking",
  ],
  Shopping: [
    "amazon",
    "flipkart",
    "myntra",
    "nykaa",
    "mall",
    "supermarket",
    "grocery",
    "retail",
    "store",
    "shop",
    "clothing",
    "shoes",
    "bigbasket",
    "blinkit",
    "instamart",
    "zepto",
    "dunzo",
  ],
  Entertainment: [
    "netflix",
    "amazon prime",
    "hotstar",
    "youtube",
    "spotify",
    "apple music",
    "gaming",
    "game",
    "movies",
    "cinema",
    "theatre",
    "concert",
    "ticket",
    "play store",
    "app store",
  ],
  Utilities: [
    "electricity",
    "water",
    "gas",
    "internet",
    "wifi",
    "broadband",
    "phone bill",
    "mobile",
    "recharge",
    "telecom",
    "bill payment",
  ],
  Healthcare: [
    "hospital",
    "clinic",
    "doctor",
    "pharmacy",
    "medicine",
    "medical",
    "health",
    "dental",
    "therapy",
    "health insurance",
  ],
  Education: [
    "school",
    "college",
    "university",
    "course",
    "udemy",
    "coursera",
    "education",
    "tuition",
    "fees",
    "books",
    "training",
  ],
  Travel: [
    "flight",
    "hotel",
    "booking.com",
    "tripadvisor",
    "airbnb",
    "resort",
    "holiday",
    "tour",
    "travel",
    "accommodation",
  ],
  Rent: [
    "landlord",
    "apartment",
    "rent",
    "lease",
    "housing",
    "property",
  ],
  Salary: [
    "salary",
    "payroll",
    "wages",
    "compensation",
    "employer",
    "company",
  ],
  Freelance: [
    "freelance",
    "upwork",
    "fiverr",
    "client payment",
    "project",
  ],
  Investments: [
    "stock",
    "share",
    "mutual fund",
    "investment",
    "broker",
    "trading",
    "zerodha",
    "groww",
    "crypto",
    "bitcoin",
  ],
};

/**
 * Check if description matches merchant keywords
 * @param {string} description - Transaction description
 * @returns {string|null} - Category name if matched, null otherwise
 */
function matchMerchantCategory(description) {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(MERCHANT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Get merchant name from transaction description
 * Extracts the main merchant/brand name
 * @param {string} description - Transaction description
 * @returns {string} - Merchant name
 */
function extractMerchantName(description) {
  // Remove common patterns like dates, reference numbers, etc.
  let merchant = description
    .replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, "") // Remove dates
    .replace(/REF[:\s]*\d+/gi, "") // Remove reference numbers
    .replace(/TXN[:\s]*\d+/gi, "") // Remove transaction IDs
    .replace(/[,\-\|]/g, " ") // Replace separators with spaces
    .split(" ")
    .filter((word) => word.length > 2) // Remove short words
    .join(" ")
    .trim();

  // Take first 2-3 significant words as merchant name
  const words = merchant.split(" ");
  return words.slice(0, Math.min(3, words.length)).join(" ");
}

export { matchMerchantCategory, extractMerchantName };
