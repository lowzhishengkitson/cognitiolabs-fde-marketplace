import { z } from "zod";

const positiveAmount = z.number().finite().nonnegative();

export const searchIntentSchema = z.strictObject({
  minPrice: positiveAmount.optional(),
  maxPrice: positiveAmount.optional(),
  minRamGB: positiveAmount.optional(),
  minStorageGB: positiveAmount.optional(),
  maxWeightKg: positiveAmount.optional(),
  brand: z.string().trim().min(1).max(60).optional(),
  condition: z.enum(["Like new", "Good", "Fair"]).optional(),
  useCase: z.string().trim().min(1).max(80).optional(),
  preferences: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  message: "Minimum price must not exceed maximum price",
});

export type SearchIntent = z.infer<typeof searchIntentSchema>;
