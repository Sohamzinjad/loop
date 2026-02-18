import { z } from "zod";

const latField = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .min(1)
      .transform((val, ctx) => {
        const num = Number(val);
        if (Number.isNaN(num)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid latitude" });
          return z.NEVER;
        }
        return num;
      }),
  ])
  .refine((num) => num >= -90 && num <= 90, "Latitude out of range")
  .optional();

const lngField = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .min(1)
      .transform((val, ctx) => {
        const num = Number(val);
        if (Number.isNaN(num)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid longitude" });
          return z.NEVER;
        }
        return num;
      }),
  ])
  .refine((num) => num >= -180 && num <= 180, "Longitude out of range")
  .optional();

export const submitProjectRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["reforestation", "conservation", "renewable", "industrial"]),
  country: z.string().max(100).optional(),
  lat: latField,
  lng: lngField,
  apiEndpoint: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? val : undefined)),
  signature: z.string().min(1),
  timestamp: z.number(),
});

export type ProjectSubmissionPayload = z.infer<typeof submitProjectRequestSchema>;
