import { z } from "zod";

const price = z.number().finite().nonnegative().max(1_000_000);
// Intent records the user's request, not the catalogue's current limits.
const capacity = z.number().finite().nonnegative().max(1_000_000_000);
const weight = z.number().finite().positive().max(10_000);
const screenSize = z.number().finite().positive().max(1_000);
const batteryHealth = z.number().finite().nonnegative().max(10_000);

export const numericBoundFields = [
  "minPrice", "maxPrice", "minRamGB", "maxRamGB",
  "minStorageGB", "maxStorageGB", "minWeightKg", "maxWeightKg",
  "minScreenSizeInches", "maxScreenSizeInches",
  "minBatteryHealth", "maxBatteryHealth",
] as const;

const exclusiveBound = z.enum(numericBoundFields);
const sortField = z.enum(["price", "weightKg", "ramGB", "storageGB", "screenSizeInches", "batteryHealth"]);

export const searchIntentSchema = z.strictObject({
  minPrice: price.optional(), maxPrice: price.optional(),
  minRamGB: capacity.optional(), maxRamGB: capacity.optional(),
  minStorageGB: capacity.optional(), maxStorageGB: capacity.optional(),
  minWeightKg: weight.optional(), maxWeightKg: weight.optional(),
  minScreenSizeInches: screenSize.optional(), maxScreenSizeInches: screenSize.optional(),
  minBatteryHealth: batteryHealth.optional(), maxBatteryHealth: batteryHealth.optional(),
  brand: z.string().trim().min(1).max(60).optional(),
  condition: z.enum(["Like new", "Good", "Fair"]).optional(),
  cpuQuery: z.string().trim().min(1).max(100).optional(),
  gpuQuery: z.string().trim().min(1).max(100).optional(),
  useCase: z.string().trim().min(1).max(80).optional(),
  preferences: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  sort: z.strictObject({ field: sortField, direction: z.enum(["asc", "desc"]) }).optional(),
  // Bounds are inclusive unless their field is listed here.
  exclusiveBounds: z.array(exclusiveBound).max(numericBoundFields.length).optional(),
}).superRefine((value, context) => {
  const pairs = [
    ["minPrice", "maxPrice", "price"], ["minRamGB", "maxRamGB", "RAM"],
    ["minStorageGB", "maxStorageGB", "storage"], ["minWeightKg", "maxWeightKg", "weight"],
    ["minScreenSizeInches", "maxScreenSizeInches", "screen size"],
    ["minBatteryHealth", "maxBatteryHealth", "battery health"],
  ] as const;
  for (const [minimum, maximum, label] of pairs) {
    if (value[minimum] !== undefined && value[maximum] !== undefined && value[minimum] > value[maximum]) {
      context.addIssue({ code: "custom", message: `Minimum ${label} must not exceed maximum ${label}`, path: [minimum] });
    }
  }
  for (const field of value.exclusiveBounds ?? []) {
    if (value[field] === undefined) context.addIssue({ code: "custom", message: `Exclusive bound ${field} must have a value`, path: ["exclusiveBounds"] });
  }
});

export type SearchIntent = z.infer<typeof searchIntentSchema>;
export type NumericBoundField = (typeof numericBoundFields)[number];
