import { z } from "zod";

const price = z.number().finite().nonnegative().max(1_000_000);
const capacity = z.number().finite().int().positive().max(16_000);

export const searchIntentSchema = z.strictObject({
  minPrice: price.optional(),
  maxPrice: price.optional(),
  minRamGB: capacity.max(128).optional(),
  minStorageGB: capacity.optional(),
  maxWeightKg: z.number().finite().positive().max(20).optional(),
  brand: z.string().trim().min(1).max(60).optional(),
  condition: z.enum(["Like new", "Good", "Fair"]).optional(),
  useCase: z.string().trim().min(1).max(80).optional(),
  preferences: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  message: "Minimum price must not exceed maximum price",
});

export type SearchIntent = z.infer<typeof searchIntentSchema>;
