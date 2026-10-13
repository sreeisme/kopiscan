import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #1A2B3C");

export const FONTS = [
  "Inter",
  "Poppins",
  "Playfair Display",
  "Lora",
  "Nunito",
  "Montserrat",
  "DM Serif Display",
  "Space Grotesk",
] as const;

export const ThemeSchema = z.object({
  colors: z.object({
    primary: hex,
    onPrimary: hex,
    background: hex,
    surface: hex,
    text: hex,
    mutedText: hex,
    accent: hex,
  }),
  font: z.object({
    heading: z.enum(FONTS),
    body: z.enum(FONTS),
  }),
  radius: z.enum(["none", "sm", "md", "lg", "full"]),
  layout: z.enum(["list", "grid", "cards"]),
  assets: z.object({
    logoPath: z.string().max(300).nullable(),
    coverPath: z.string().max(300).nullable(),
  }),
  labels: z.object({
    welcome: z.string().max(120),
    callWaiter: z.string().min(1).max(30),
    requestBill: z.string().min(1).max(30),
    addToCart: z.string().min(1).max(30),
    placeOrder: z.string().min(1).max(30),
  }),
  toggles: z.object({
    showImages: z.boolean(),
    showTags: z.boolean(),
    showDescriptions: z.boolean(),
  }),
  hideBranding: z.boolean(),
});

export type Theme = z.infer<typeof ThemeSchema>;
