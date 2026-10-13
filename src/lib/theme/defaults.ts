import type { Theme } from "./schema";

export const DEFAULT_THEME: Theme = {
  colors: {
    primary: "#C2410C",
    onPrimary: "#FFFFFF",
    background: "#FFFBF7",
    surface: "#FFFFFF",
    text: "#1F1A17",
    mutedText: "#6B625C",
    accent: "#2A9D8F",
  },
  font: { heading: "Poppins", body: "Inter" },
  radius: "lg",
  layout: "list",
  assets: { logoPath: null, coverPath: null },
  labels: {
    welcome: "",
    callWaiter: "Call waiter",
    requestBill: "Request bill",
    addToCart: "Add to order",
    placeOrder: "Place order",
  },
  toggles: { showImages: true, showTags: true, showDescriptions: true },
  hideBranding: false,
};
