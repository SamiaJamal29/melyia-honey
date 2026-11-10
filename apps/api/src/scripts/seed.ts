import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseServices } from "../config/firebase-admin.js";

interface SeedProduct {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly category: "raw" | "gift";
  readonly origin: string;
  readonly weightGrams: number;
  readonly retailPriceSen: number;
  readonly availableQuantity: number;
  readonly lowStockThreshold: number;
}

export const seedProducts: readonly SeedProduct[] = [
  {
    id: "tualang",
    name: "Tualang",
    slug: "tualang",
    description:
      "Drawn from the towering Tualang trees of the Pahang rainforest. Dark, malty and faintly smoky, with a lingering finish. Cold-extracted and never heated.",
    shortDescription: "Bold, malty, faintly smoky. 500g.",
    category: "raw",
    origin: "Pahang",
    weightGrams: 500,
    retailPriceSen: 4_800,
    availableQuantity: 120,
    lowStockThreshold: 12,
  },
  {
    id: "kelulut",
    name: "Kelulut",
    slug: "kelulut",
    description:
      "Harvested from stingless kelulut bees, prized across Southeast Asia for its tangy, citrus-bright profile and naturally higher antioxidant content.",
    shortDescription: "Tangy, citrus-bright stingless-bee honey. 350g.",
    category: "raw",
    origin: "Kelantan",
    weightGrams: 350,
    retailPriceSen: 6_800,
    availableQuantity: 80,
    lowStockThreshold: 10,
  },
  {
    id: "acacia",
    name: "Acacia Raw",
    slug: "acacia",
    description:
      "Pale, delicate and floral. Acacia is slow to crystallise and gentle enough for the whole family, stirring beautifully into tea and yogurt.",
    shortDescription: "Light, floral, slow to crystallise. 500g.",
    category: "raw",
    origin: "Perak",
    weightGrams: 500,
    retailPriceSen: 4_200,
    availableQuantity: 140,
    lowStockThreshold: 14,
  },
  {
    id: "gelam",
    name: "Gelam Coastal",
    slug: "gelam",
    description:
      "From the gelam forests along the Terengganu coast. Distinctly herbal and slightly medicinal, long valued in traditional Malay remedies.",
    shortDescription: "Herbal coastal gelam honey. 500g.",
    category: "raw",
    origin: "Terengganu",
    weightGrams: 500,
    retailPriceSen: 5_400,
    availableQuantity: 90,
    lowStockThreshold: 10,
  },
  {
    id: "gift",
    name: "Gift Trio",
    slug: "gift-trio",
    description:
      "Tualang, Kelulut and Acacia in a hand-boxed gift set. Ready to give, beautifully presented, and endlessly welcome.",
    shortDescription: "Three signature honeys, hand-boxed. 3×250g.",
    category: "gift",
    origin: "Assorted",
    weightGrams: 750,
    retailPriceSen: 12_000,
    availableQuantity: 45,
    lowStockThreshold: 6,
  },
];

const seed = async (): Promise<void> => {
  const { db } = getFirebaseServices();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const product of seedProducts) {
    const { availableQuantity, lowStockThreshold, id, ...productData } = product;
    batch.set(db.collection("products").doc(id), {
      ...productData,
      imageUrls: [],
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });
    batch.set(db.collection("inventory").doc(id), {
      productId: id,
      availableQuantity,
      lowStockThreshold,
      updatedAt: now,
      updatedBy: "seed",
    });
  }

  await batch.commit();
  console.info(`Seeded ${seedProducts.length} Melyia products.`);
};

void seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(message);
  process.exitCode = 1;
});
