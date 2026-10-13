import type { Theme } from "./schema";

export type Preset = { id: string; name: string; colors: Theme["colors"]; font: Theme["font"]; radius: Theme["radius"] };

/** Presets are available on every plan (Basic gets presets + logo + primary colour). */
export const PRESETS: Preset[] = [
  {
    id: "warm",
    name: "Warm Kopitiam",
    colors: { primary: "#C2410C", onPrimary: "#FFFFFF", background: "#FFFBF7", surface: "#FFFFFF", text: "#1F1A17", mutedText: "#6B625C", accent: "#2A9D8F" },
    font: { heading: "Poppins", body: "Inter" },
    radius: "lg",
  },
  {
    id: "noir",
    name: "Noir Bistro",
    colors: { primary: "#D4AF37", onPrimary: "#111111", background: "#111111", surface: "#1C1C1C", text: "#F5F5F5", mutedText: "#A3A3A3", accent: "#D4AF37" },
    font: { heading: "Playfair Display", body: "Lora" },
    radius: "sm",
  },
  {
    id: "fresh",
    name: "Fresh Garden",
    colors: { primary: "#2F7D4F", onPrimary: "#FFFFFF", background: "#F6FBF7", surface: "#FFFFFF", text: "#15261C", mutedText: "#5A6B60", accent: "#F2A93B" },
    font: { heading: "Nunito", body: "Nunito" },
    radius: "full",
  },
  {
    id: "ocean",
    name: "Ocean Seafood",
    colors: { primary: "#1D4E89", onPrimary: "#FFFFFF", background: "#F4F8FC", surface: "#FFFFFF", text: "#0F1E2E", mutedText: "#556578", accent: "#F25F5C" },
    font: { heading: "Montserrat", body: "Inter" },
    radius: "md",
  },
  {
    id: "sakura",
    name: "Sakura",
    colors: { primary: "#C2185B", onPrimary: "#FFFFFF", background: "#FFF7FA", surface: "#FFFFFF", text: "#2B1520", mutedText: "#7A5F6B", accent: "#5C6BC0" },
    font: { heading: "DM Serif Display", body: "Inter" },
    radius: "lg",
  },
  {
    id: "mono",
    name: "Modern Mono",
    colors: { primary: "#111111", onPrimary: "#FFFFFF", background: "#FFFFFF", surface: "#F5F5F5", text: "#111111", mutedText: "#666666", accent: "#FF5A1F" },
    font: { heading: "Space Grotesk", body: "Space Grotesk" },
    radius: "none",
  },
];
