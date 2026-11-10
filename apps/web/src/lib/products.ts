export type HoneyTone = "amber" | "gold" | "forest" | "pale" | "trio";

export interface StoreProduct {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly category: "raw" | "gift";
  readonly origin: string;
  readonly weightGrams: number;
  readonly retailPriceSen: number;
  readonly badge: string;
  readonly tone: HoneyTone;
  readonly tastingNotes: readonly string[];
  readonly imageUrls?: readonly string[];
  readonly photoCredit?: {
    readonly label: string;
    readonly href: string;
  };
}

export const products: readonly StoreProduct[] = [
  {
    id: "tualang",
    name: "Al Deera Honey",
    slug: "tualang",
    description:
      "A deep, mineral-rich forest honey gathered from towering Tualang trees in Pahang. Cold-extracted in small batches to retain its naturally bold character.",
    shortDescription: "Bold forest honey with a deep mineral finish.",
    category: "raw",
    origin: "Pahang",
    weightGrams: 500,
    retailPriceSen: 4_500,
    badge: "Bestseller",
    tone: "amber",
    tastingNotes: ["Malt", "Wild herbs", "Mineral"],
    imageUrls: ["/products/tualang-design.jpg"],
    photoCredit: {
      label: "Photo by Arwin Neil Baichoo on Unsplash",
      href: "https://unsplash.com/@arwinneil",
    },
  },
  {
    id: "kelulut",
    name: "Al Zain Honey",
    slug: "kelulut",
    description:
      "A bright, gently tart honey from Malaysian stingless bees. Harvested in Kelantan with a lively fruit-forward profile and silky texture.",
    shortDescription: "Bright stingless-bee honey with a gentle tang.",
    category: "raw",
    origin: "Kelantan",
    weightGrams: 350,
    retailPriceSen: 6_500,
    badge: "Rare",
    tone: "forest",
    tastingNotes: ["Tamarind", "Citrus", "Floral"],
    imageUrls: ["/products/kelulut-design.jpg"],
    photoCredit: {
      label: "Photo by Yulia Khlebnikova on Unsplash",
      href: "https://unsplash.com/@khlebnikovayulia",
    },
  },
  {
    id: "acacia",
    name: "Al Ward Honey",
    slug: "acacia",
    description:
      "A mellow, luminous honey from Perak with a clean floral aroma. Its gentle sweetness makes it an easy everyday spoonful.",
    shortDescription: "Mellow and floral, made for everyday pouring.",
    category: "raw",
    origin: "Perak",
    weightGrams: 500,
    retailPriceSen: 4_000,
    badge: "Mild",
    tone: "pale",
    tastingNotes: ["Vanilla", "White flowers", "Pear"],
    imageUrls: ["/products/acacia-design.jpg"],
    photoCredit: {
      label: "Photo by Maja Jugovic on Unsplash",
      href: "https://unsplash.com/@majapcelica88",
    },
  },
  {
    id: "gelam",
    name: "Al Bait Honey",
    slug: "gelam",
    description:
      "A fragrant coastal honey from Terengganu's Gelam forests. Rounded and aromatic with a soft spice that lingers after each spoonful.",
    shortDescription: "Fragrant coastal honey with a soft spice note.",
    category: "raw",
    origin: "Terengganu",
    weightGrams: 500,
    retailPriceSen: 5_000,
    badge: "New",
    tone: "gold",
    tastingNotes: ["Clove", "Tea", "Caramel"],
    imageUrls: ["/products/tualang-design.jpg"],
    photoCredit: {
      label: "Photo by Arwin Neil Baichoo on Unsplash",
      href: "https://unsplash.com/@arwinneil",
    },
  },
  {
    id: "gift",
    name: "Honey Box",
    slug: "gift-trio",
    description:
      "Three distinct Malaysian origins in one generous gift set. A considered introduction to Tualang, Kelulut, and Acacia honey.",
    shortDescription: "Three Malaysian origins, beautifully boxed to share.",
    category: "gift",
    origin: "Assorted Malaysian harvests",
    weightGrams: 750,
    retailPriceSen: 12_000,
    badge: "Gift set",
    tone: "trio",
    tastingNotes: ["Forest", "Bright", "Floral"],
    imageUrls: ["/products/gift-design.jpg"],
    photoCredit: {
      label: "Photo by Maxim Tolchinskiy on Unsplash",
      href: "https://unsplash.com/@shaikhulud",
    },
  },
];

export const getProduct = (slug: string): StoreProduct | undefined =>
  products.find((product) => product.slug === slug);
