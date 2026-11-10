import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const firestoreTimestampSchema = z.custom<Timestamp>(
  (value) => value instanceof Timestamp,
  "A Firestore Timestamp is required.",
);

export const malaysiaAddressSchema = z.object({
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postcode: z.string().regex(/^\d{5}$/, "A five-digit Malaysian postcode is required."),
  country: z.literal("MY"),
});

export const malaysiaPhoneSchema = z
  .string()
  .regex(/^\+60\d{8,10}$/, "A Malaysian phone number in +60 format is required.");
