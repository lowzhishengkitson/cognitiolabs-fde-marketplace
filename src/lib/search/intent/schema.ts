import { z } from "zod";

const price = z.number().finite().nonnegative().max(1_000_000);
// These are user-requested capacities, not catalogue capabilities. Keep a
// generous safety bound so impossible requests remain valid and simply match
// zero listings instead of being discarded during parsing.
const capacity = z.number().finite().int().positive().max(1_000_000_000);

export const searchIntentSchema = z.strictObject({
  minPrice: price.optional(),
  maxPrice: price.optional(),
  minRamGB: capacity.optional(),
  minStorageGB: capacity.optional(),
  maxWeightKg: z.number().finite().positive().max(20).optional(),
  brand: z.string().trim().min(1).max(60).optional(),
  condition: z.enum(["Like new", "Good", "Fair"]).optional(),
  useCase: z.string().trim().min(1).max(80).optional(),
  preferences: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  sort: z.strictObject({ field: z.enum(["price", "weightKg", "ramGB", "storageGB", "batteryHealth"]), direction: z.enum(["asc", "desc"]) }).optional(),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  message: "Minimum price must not exceed maximum price",
});

export type SearchIntent = z.infer<typeof searchIntentSchema>;
