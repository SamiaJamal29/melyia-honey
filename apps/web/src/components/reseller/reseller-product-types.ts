export interface ResellerSubmission {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly category: "raw" | "gift";
  readonly origin: string;
  readonly weightGrams: number;
  readonly retailPriceSen: number;
  readonly imageUrls: readonly string[];
  readonly submissionStatus: "pending" | "approved" | "rejected";
  readonly isPublished: boolean;
}
